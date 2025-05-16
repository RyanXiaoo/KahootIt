from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # For server-side default timestamp

from database import Base # Import Base from our database.py

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # email = Column(String, unique=True, index=True, nullable=True) # Optional
    # full_name = Column(String, index=True, nullable=True) # Optional
    # is_active = Column(Boolean, default=True) # Optional

    quizzes = relationship("Quiz", back_populates="owner")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False) # e.g., from PDF filename, or user-defined
    pdf_filename = Column(String, index=True, nullable=True) # Store original PDF filename
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="quizzes")

    # Relationship to questions: one quiz can have many questions
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False) # e.g., {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}
    correct_answer_index = Column(Integer, nullable=False) # Changed from correct_answer: String(1)
    explanation = Column(Text, nullable=True) # Uncommented and ensured type

    # Relationship to quiz: each question belongs to one quiz
    quiz = relationship("Quiz", back_populates="questions")

# If we add users later, the User model would look something like this:
# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True, nullable=False)
#     email = Column(String, unique=True, index=True, nullable=True)
#     hashed_password = Column(String, nullable=False)
#     is_active = Column(Boolean, default=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
# 
#     quizzes = relationship("Quiz", back_populates="owner") 