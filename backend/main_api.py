from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm # Added for auth
import uuid # For generating unique game IDs
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Assuming pdf_processor.py is in the same directory (backend/)
from pdf_processor import generate_quiz_from_pdf_stream
# Import database components and models
import models as models # Use alias for clarity
from database import engine, get_db # Removed SessionLocal as get_db provides session
# Import schemas
from schemas import User as UserSchema, UserCreate, Token as TokenSchema # Removed TokenData as it's used internally in auth.py mostly
# Import auth utilities, including get_current_user
import auth as auth_utils # Alias for clarity
from auth import get_current_user # Explicit import for Depends

# Create database tables if they don't exist
# This should be called once when the application starts.
# For more complex applications, you might use Alembic for migrations.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KahootIt API",
    description="API for generating Kahoot-style quizzes from PDF notes.",
    version="0.1.0",
)

# --- Pydantic Schemas for Users and Tokens ---
# REMOVED - These are now in backend/schemas.py
# class UserBase(BaseModel):
# class UserCreate(UserBase):
# class User(UserBase):
# class Token(BaseModel):
# class TokenData(BaseModel):

# --- OAuth2 Password Bearer ---
# This tells FastAPI where to look for the token (in the Authorization header)
# The tokenUrl MUST point to the actual login endpoint path
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # UPDATED from "token"


# --- User Registration Endpoint ---
@app.post("/register", response_model=UserSchema, tags=["Authentication"], summary="Register a new user") # RENAMED from /users/, response_model uses imported schema
async def create_user(user: UserCreate, db: Session = Depends(get_db)): # Parameter uses imported schema
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth_utils.get_password_hash(user.password) # Use aliased import
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user # FastAPI will convert this to UserSchema due to orm_mode and response_model

# --- Token Generation Endpoint (Login) ---
@app.post("/login", response_model=TokenSchema, tags=["Authentication"], summary="Log in to get an access token") # RENAMED from /token, response_model uses imported schema
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password): # Use aliased import
        raise HTTPException(
            status_code=401, # Consider using status.HTTP_401_UNAUTHORIZED
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES) # Use aliased import
    access_token = auth_utils.create_access_token( # Use aliased import
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Dependency to get current user ---
# REMOVED - This is now imported from backend.auth.py
# async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):

# Example of a protected endpoint (we will modify existing endpoints later)
@app.get("/users/me", response_model=UserSchema, tags=["User"], summary="Get current user details") # response_model uses imported schema
async def read_users_me(current_user: UserSchema = Depends(get_current_user)): # Type hint uses imported UserSchema, Depends uses imported get_current_user
    return current_user


# Remove the old in-memory storage
# active_quizzes: Dict[str, List[Dict]] = {}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the KahootIt API!"}

@app.post("/upload-notes/", summary="Upload PDF and create a quiz (Login Required)", tags=["Quiz Management"])
async def create_quiz_from_upload(
    file: UploadFile = File(..., description="The PDF file to process."),
    start_page: Optional[int] = Form(None, description="1-indexed start page for processing."),
    end_page: Optional[int] = Form(None, description="1-indexed end page for processing."),
    questions_per_chunk: Optional[int] = Form(3, description="Number of questions to generate per text chunk."),
    max_total_questions: Optional[int] = Form(10, description="Maximum total questions to generate for the PDF."),
    db: Session = Depends(get_db), # Inject DB session
    current_user: UserSchema = Depends(get_current_user) # MODIFIED to use imported UserSchema and get_current_user
):
    """
    Uploads a PDF, processes it, generates questions, stores them in the database
    associated with the logged-in user, and returns a quiz ID.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are accepted.")

    try:
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

        print(f"Received file: {file.filename} for user: {current_user.username}, size: {len(pdf_bytes)} bytes")
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

        # Create Quiz record in DB, associated with the current user
        db_quiz = models.Quiz(
            title=file.filename, # Or some other title logic
            pdf_filename=file.filename, 
            user_id=current_user.id # Associate with the logged-in user (UserSchema has id)
        )
        db.add(db_quiz)
        print(f"Attempting to commit quiz for {file.filename} by user {current_user.username}...")
        db.commit() # Commit to get the quiz ID
        print(f"Quiz committed. Quiz ID from DB: {db_quiz.id}, Created at: {db_quiz.created_at}")
        db.refresh(db_quiz) # Refresh to get the auto-generated ID and created_at

        # Create Question records in DB, associated with the Quiz
        print(f"Attempting to add {len(generated_question_data)} questions for Quiz ID {db_quiz.id}...")
        for q_data in generated_question_data:
            db_question = models.Question(
                quiz_id=db_quiz.id,
                question_text=q_data["question"],
                options=q_data["options"], # SQLAlchemy handles JSON conversion
                correct_answer_index=q_data["correct_answer_index"],
                explanation=q_data["explanation"]
            )
            db.add(db_question)
        print(f"Attempting to commit {len(generated_question_data)} questions...")
        db.commit() # Commit all questions for this quiz
        print(f"Questions committed for Quiz ID {db_quiz.id}.")

        return {
            "message": "PDF processed and quiz generated successfully!",
            "quiz_id": db_quiz.id, # Return the database ID
            "filename": file.filename,
            "num_questions_generated": len(generated_question_data),
            # To return question previews, you might need to query them back or format them from generated_question_data
            # For simplicity, let's just return the first few from the input data if needed
            "questions_preview": generated_question_data[:2] 
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Error processing upload for {file.filename}: {e}")
        # Rollback DB changes in case of error during processing, though commit points are strategic
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/game/{game_id}") # game_id is now quiz_id from the DB
async def get_quiz_questions(game_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the set of generated questions for a given quiz_id from the database.
    """
    # Query the database for the quiz and its questions
    # .options(joinedload(models.Quiz.questions)) can be used for eager loading if needed
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == game_id).first()
    
    if db_quiz is None:
        raise HTTPException(status_code=404, detail=f"Quiz ID '{game_id}' not found.")
    
    # Questions are available via the relationship db_quiz.questions
    # We need to format them into a list of dicts if they aren't already suitable
    # (SQLAlchemy model instances need to be converted for JSON response typically)
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
        "pdf_filename": db_quiz.pdf_filename,
        "created_at": db_quiz.created_at.isoformat(),
        "num_questions": len(questions_response),
        "questions": questions_response
    }

# We will add more endpoints here later, such as:
# - GET /game/{game_id}

if __name__ == "__main__":
    import uvicorn
    # This is for running the app directly for development.
    # For production, you might use a different command or setup.
    # The host "0.0.0.0" makes it accessible on your network.
    # Reload=True will automatically reload the server when you save changes.
    uvicorn.run("main_api:app", host="0.0.0.0", port=8000, reload=True) 