from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, index=True)  # UUID from Supabase auth
    username = Column(String, unique=True, index=True, nullable=False)

    quizzes = relationship("Quiz", back_populates="owner")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    pdf_filename = Column(String, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    question_count = Column(Integer, nullable=False, default=0)

    user_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    owner = relationship("Profile", back_populates="quizzes")

    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_answer_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class GameSession(Base):
    """Represents a live game session with a PIN code"""
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    pin = Column(String(6), unique=True, nullable=False, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    host_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    status = Column(String(20), default="lobby", nullable=False)
    current_question_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    quiz = relationship("Quiz")
    host = relationship("Profile")
    player_responses = relationship("PlayerResponse", back_populates="game_session", cascade="all, delete-orphan")


class PlayerResponse(Base):
    """Records each player's answer to a question in a game session"""
    __tablename__ = "player_responses"

    id = Column(Integer, primary_key=True, index=True)
    game_session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)
    player_name = Column(String(50), nullable=False)
    player_socket_id = Column(String(100), nullable=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_index = Column(Integer, nullable=False)
    time_taken_ms = Column(Integer, nullable=True)
    points_earned = Column(Integer, default=0)
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    game_session = relationship("GameSession", back_populates="player_responses")
    question = relationship("Question")
