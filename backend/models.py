from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # For server-side default timestamp

from database import Base # Import Base from our database.py

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    # If we integrate users later, we would add user_id here as a ForeignKey
    # user_id = Column(Integer, ForeignKey("users.id")) 
    pdf_filename = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # If you want to store the raw page range used:
    # start_page = Column(Integer, nullable=True)
    # end_page = Column(Integer, nullable=True)

    # Relationship to questions: one quiz can have many questions
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")

    # If we have users:
    # owner = relationship("User", back_populates="quizzes")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(String, nullable=False)
    # Storing options as JSON. Could also be a separate table for more complex option structures.
    options = Column(JSON, nullable=False) # List of strings
    correct_answer_index = Column(Integer, nullable=False)
    explanation = Column(String, nullable=True)

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