from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
import uuid # For generating unique game IDs
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

# Assuming pdf_processor.py is in the same directory (backend/)
from pdf_processor import generate_quiz_from_pdf_stream
# Import database components and models
import models #. represents current directory
from database import SessionLocal, engine, get_db # Changed from .database

# Create database tables if they don't exist
# This should be called once when the application starts.
# For more complex applications, you might use Alembic for migrations.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KahootIt API",
    description="API for generating Kahoot-style quizzes from PDF notes.",
    version="0.1.0",
)

# Remove the old in-memory storage
# active_quizzes: Dict[str, List[Dict]] = {}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the KahootIt API!"}

@app.post("/upload-notes/")
async def create_quiz_from_upload(
    file: UploadFile = File(..., description="The PDF file to process."),
    start_page: Optional[int] = Form(None, description="1-indexed start page for processing."),
    end_page: Optional[int] = Form(None, description="1-indexed end page for processing."),
    questions_per_chunk: Optional[int] = Form(3, description="Number of questions to generate per text chunk."),
    max_total_questions: Optional[int] = Form(10, description="Maximum total questions to generate for the PDF."),
    db: Session = Depends(get_db) # Inject DB session
):
    """
    Uploads a PDF, processes it, generates questions, stores them in the database,
    and returns a quiz ID.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are accepted.")

    try:
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

        print(f"Received file: {file.filename}, size: {len(pdf_bytes)} bytes")
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

        # Create Quiz record in DB
        db_quiz = models.Quiz(pdf_filename=file.filename)
        db.add(db_quiz)
        print(f"Attempting to commit quiz for {file.filename}...")
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