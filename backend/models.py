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
    question_count = Column(Integer, nullable=False, default=0) # Added question_count
    
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

class GameSession(Base):
    """Represents a live game session with a PIN code"""
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    pin = Column(String(6), unique=True, nullable=False, index=True)  # 6-digit PIN code
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="lobby", nullable=False)  # lobby, active, finished
    current_question_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    quiz = relationship("Quiz")
    host = relationship("User")
    player_responses = relationship("PlayerResponse", back_populates="game_session", cascade="all, delete-orphan")

class PlayerResponse(Base):
    """Records each player's answer to a question in a game session"""
    __tablename__ = "player_responses"

    id = Column(Integer, primary_key=True, index=True)
    game_session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)
    player_name = Column(String(50), nullable=False)  # Players don't need accounts
    player_socket_id = Column(String(100), nullable=True)  # To track WebSocket connections
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_index = Column(Integer, nullable=False)  # 0-3 for A-D
    time_taken_ms = Column(Integer, nullable=True)  # Milliseconds to answer (for speed points)
    points_earned = Column(Integer, default=0)
    answered_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    game_session = relationship("GameSession", back_populates="player_responses")
    question = relationship("Question") 