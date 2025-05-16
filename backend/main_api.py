from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import uuid
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel

from pdf_processor import generate_quiz_from_pdf_stream
import models
from database import engine, get_db
import auth
from auth import get_current_user

# Create database tables if they don't exist
# This should be called once when the application starts.
# For more complex applications, you might use Alembic for migrations.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KahootIt API",
    description="API for generating Kahoot-style quizzes from PDF notes.",
    version="0.1.0",
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # Standard localhost for Next.js dev
    "http://127.0.0.1:3000", # Another common localhost for Next.js dev
    "http://10.120.3.77:3000", # The origin shown in your error message
    # Add any other origins your frontend might be served from (e.g., deployed URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"],    
    allow_headers=["*"],    
)

# --- Pydantic Schemas for Users and Tokens ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserDisplay(UserBase):
    id: int

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- OAuth2 Password Bearer ---
# This tells FastAPI where to look for the token (in the Authorization header)
# The tokenUrl MUST point to the actual login endpoint path
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- User Registration Endpoint ---
@app.post("/register", response_model=UserDisplay, tags=["Authentication"], summary="Register a new user")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Token Generation Endpoint (Login) ---
@app.post("/token", response_model=Token, tags=["Authentication"], summary="Log in to get an access token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Example of a protected endpoint (we will modify existing endpoints later)
@app.get("/users/me", response_model=UserDisplay, tags=["User"], summary="Get current user details")
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/")
async def read_root():
    return {"message": "Welcome to the KahootIt API!"}

@app.post("/upload-notes/", summary="Upload PDF and create a quiz (Login Required)", tags=["Quiz Management"])
async def create_quiz_from_upload(
    file: UploadFile = File(..., description="The PDF file to process."),
    quiz_custom_title: str = Form(..., description="Custom title for the quiz. This field is required."),
    start_page: Optional[int] = Form(None, description="1-indexed start page for processing."),
    end_page: Optional[int] = Form(None, description="1-indexed end page for processing."),
    questions_per_chunk: Optional[int] = Form(3, description="Number of questions to generate per text chunk."),
    max_total_questions: Optional[int] = Form(10, description="Maximum total questions to generate for the PDF."),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Uploads a PDF, processes it, generates questions, stores them in the database
    associated with the logged-in user, and returns a quiz ID.
    A custom title for the quiz MUST be provided.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")
    
    if not quiz_custom_title or not quiz_custom_title.strip():
        raise HTTPException(status_code=400, detail="Quiz custom title cannot be empty.")
    
    actual_quiz_title = quiz_custom_title.strip()

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are accepted.")

    try:
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

        print(f"Received file: {file.filename} for user: {current_user.username}, custom title: {actual_quiz_title}, size: {len(pdf_bytes)} bytes")
        print(f"Processing parameters: start_page={start_page}, end_page={end_page}, q_per_chunk={questions_per_chunk}, max_q={max_total_questions}")

        generated_question_data = generate_quiz_from_pdf_stream(
            pdf_bytes=pdf_bytes,
            filename=file.filename,
            start_page=start_page,
            end_page=end_page,
            questions_per_chunk=questions_per_chunk if questions_per_chunk is not None else 3,
            max_total_questions=max_total_questions if max_total_questions is not None else 10
        )

        if not generated_question_data:
            raise HTTPException(status_code=422, detail="Could not generate questions from the PDF.")

        # Calculate question count
        num_questions = len(generated_question_data)

        db_quiz = models.Quiz(
            title=actual_quiz_title,
            pdf_filename=file.filename, 
            user_id=current_user.id,
            question_count=num_questions  # Set the question_count here
        )
        db.add(db_quiz)
        print(f"Attempting to commit quiz titled '{actual_quiz_title}' for {file.filename} by user {current_user.username}...")
        db.commit()
        print(f"Quiz committed. Quiz ID from DB: {db_quiz.id}, Created at: {db_quiz.created_at}")
        db.refresh(db_quiz)

        print(f"Attempting to add {len(generated_question_data)} questions for Quiz ID {db_quiz.id}...")
        for q_data in generated_question_data:
            db_question = models.Question(
                quiz_id=db_quiz.id,
                question_text=q_data["question"],
                options=q_data["options"],
                correct_answer_index=q_data["correct_answer_index"],
                explanation=q_data["explanation"]
            )
            db.add(db_question)
        print(f"Attempting to commit {len(generated_question_data)} questions...")
        db.commit()
        print(f"Questions committed for Quiz ID {db_quiz.id}.")

        return {
            "message": "PDF processed and quiz generated successfully!",
            "quiz_id": db_quiz.id,
            "quiz_title": db_quiz.title,
            "filename": file.filename,
            "num_questions_generated": len(generated_question_data),
            "questions_preview": generated_question_data[:2] 
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Error processing upload for {file.filename}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/game/{game_id}")
async def get_quiz_questions(game_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the set of generated questions for a given quiz_id from the database.
    """
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == game_id).first()
    
    if db_quiz is None:
        raise HTTPException(status_code=404, detail=f"Quiz ID '{game_id}' not found.")
    
    questions_response = [
        {
            "id": q.id,
            "question_text": q.question_text,
            "options": q.options,
            "correct_answer_index": q.correct_answer_index,
            "explanation": q.explanation
        } for q in db_quiz.questions
    ]

    return {
        "quiz_id": db_quiz.id,
        "quiz_title": db_quiz.title,
        "pdf_filename": db_quiz.pdf_filename,
        "created_at": db_quiz.created_at.isoformat(),
        "num_questions": len(questions_response),
        "questions": questions_response
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_api:app", host="0.0.0.0", port=8000, reload=True) 