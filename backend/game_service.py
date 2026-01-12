"""
Game Service - Business logic for real-time multiplayer quiz games
"""
import random
import string
from datetime import datetime, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

import models


def generate_pin(db: Session) -> str:
    """
    Generate a unique 6-digit PIN for a game session.
    Ensures the PIN doesn't already exist in the database.
    """
    max_attempts = 100
    for _ in range(max_attempts):
        # Generate random 6-digit number
        pin = ''.join(random.choices(string.digits, k=6))
        
        # Check if PIN already exists
        existing = db.query(models.GameSession).filter(models.GameSession.pin == pin).first()
        if not existing:
            return pin
    
    raise Exception("Unable to generate unique PIN after multiple attempts")


def create_game_session(db: Session, quiz_id: int, host_id: int) -> models.GameSession:
    """
    Create a new game session with a unique PIN.
    
    Args:
        db: Database session
        quiz_id: ID of the quiz to play
        host_id: ID of the host user
    
    Returns:
        GameSession object with generated PIN
    """
    # Verify quiz exists and belongs to host
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.user_id == host_id
    ).first()
    
    if not quiz:
        raise ValueError("Quiz not found or you don't have permission to host it")
    
    # Generate unique PIN
    pin = generate_pin(db)
    
    # Create game session
    game_session = models.GameSession(
        pin=pin,
        quiz_id=quiz_id,
        host_id=host_id,
        status="lobby",
        current_question_index=0
    )
    
    db.add(game_session)
    db.commit()
    db.refresh(game_session)
    
    return game_session


def validate_pin(db: Session, pin: str) -> Optional[models.GameSession]:
    """
    Check if a PIN corresponds to an active game session.
    
    Args:
        db: Database session
        pin: 6-digit PIN code
    
    Returns:
        GameSession if found and joinable, None otherwise
    """
    if not pin or len(pin) != 6 or not pin.isdigit():
        return None
    
    game_session = db.query(models.GameSession).filter(
        models.GameSession.pin == pin
    ).first()
    
    # Can only join games in lobby or active status (not finished)
    if game_session and game_session.status in ["lobby", "active"]:
        return game_session
    
    return None


def start_game(db: Session, game_session_id: int) -> bool:
    """
    Start a game session (move from lobby to active).
    
    Args:
        db: Database session
        game_session_id: ID of the game session
    
    Returns:
        True if successful, False otherwise
    """
    game_session = db.query(models.GameSession).filter(
        models.GameSession.id == game_session_id
    ).first()
    
    if not game_session or game_session.status != "lobby":
        return False
    
    game_session.status = "active"
    game_session.started_at = datetime.now(timezone.utc)
    db.commit()
    
    return True


def advance_question(db: Session, game_session_id: int) -> Optional[int]:
    """
    Move to the next question in the game.
    
    Args:
        db: Database session
        game_session_id: ID of the game session
    
    Returns:
        New question index, or None if game is finished
    """
    game_session = db.query(models.GameSession).filter(
        models.GameSession.id == game_session_id
    ).first()
    
    if not game_session or game_session.status != "active":
        return None
    
    # Get total question count
    question_count = len(game_session.quiz.questions)
    
    # Move to next question
    game_session.current_question_index += 1
    
    # Check if game is finished
    if game_session.current_question_index >= question_count:
        game_session.status = "finished"
        game_session.ended_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return game_session.current_question_index


def calculate_points(time_taken_ms: int, question_time_limit_ms: int = 20000, base_points: int = 1000) -> int:
    """
    Calculate points based on speed and correctness.
    Faster answers get more points (like real Kahoot).
    
    Args:
        time_taken_ms: Milliseconds taken to answer
        question_time_limit_ms: Maximum time allowed (default 20 seconds)
        base_points: Maximum points for a correct answer
    
    Returns:
        Points earned (0 if time exceeded, scaled by speed otherwise)
    """
    if time_taken_ms > question_time_limit_ms:
        return 0  # Too slow, no points
    
    # Calculate speed bonus: faster = more points
    # Points = base_points * (1 - time_ratio/2)
    # If answered immediately: 1.0 * base_points
    # If answered at last second: 0.5 * base_points
    time_ratio = time_taken_ms / question_time_limit_ms
    speed_multiplier = 1.0 - (time_ratio * 0.5)
    
    points = int(base_points * speed_multiplier)
    return max(0, points)  # Ensure non-negative


def record_answer(
    db: Session,
    game_session_id: int,
    player_name: str,
    question_id: int,
    answer_index: int,
    time_taken_ms: int,
    player_socket_id: Optional[str] = None
) -> models.PlayerResponse:
    """
    Record a player's answer to a question.
    
    Args:
        db: Database session
        game_session_id: ID of the game session
        player_name: Name of the player
        question_id: ID of the question
        answer_index: Index of chosen answer (0-3)
        time_taken_ms: Time taken to answer in milliseconds
        player_socket_id: Socket ID for tracking connection
    
    Returns:
        PlayerResponse object with calculated points
    """
    # Get the question to check correct answer
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    
    if not question:
        raise ValueError("Question not found")
    
    # Calculate points (0 if incorrect)
    is_correct = (answer_index == question.correct_answer_index)
    points = calculate_points(time_taken_ms) if is_correct else 0
    
    # Create response record
    response = models.PlayerResponse(
        game_session_id=game_session_id,
        player_name=player_name,
        player_socket_id=player_socket_id,
        question_id=question_id,
        answer_index=answer_index,
        time_taken_ms=time_taken_ms,
        points_earned=points
    )
    
    db.add(response)
    db.commit()
    db.refresh(response)
    
    return response


def get_leaderboard(db: Session, game_session_id: int) -> List[Dict[str, any]]:
    """
    Get current leaderboard for a game session.
    Aggregates points by player name and ranks them.
    
    Args:
        db: Database session
        game_session_id: ID of the game session
    
    Returns:
        List of player standings with rank, name, and total points
    """
    # Aggregate points by player
    leaderboard_query = db.query(
        models.PlayerResponse.player_name,
        func.sum(models.PlayerResponse.points_earned).label('total_points'),
        func.count(models.PlayerResponse.id).label('questions_answered')
    ).filter(
        models.PlayerResponse.game_session_id == game_session_id
    ).group_by(
        models.PlayerResponse.player_name
    ).order_by(
        desc('total_points')
    ).all()
    
    # Format as list of dicts with rank
    leaderboard = []
    for rank, (player_name, total_points, questions_answered) in enumerate(leaderboard_query, start=1):
        leaderboard.append({
            "rank": rank,
            "player_name": player_name,
            "total_points": int(total_points) if total_points else 0,
            "questions_answered": questions_answered
        })
    
    return leaderboard


def get_question_results(db: Session, game_session_id: int, question_id: int) -> Dict[str, any]:
    """
    Get answer distribution for a specific question (for host view).
    
    Args:
        db: Database session
        game_session_id: ID of the game session
        question_id: ID of the question
    
    Returns:
        Dict with answer distribution and stats
    """
    # Count answers by option
    responses = db.query(models.PlayerResponse).filter(
        models.PlayerResponse.game_session_id == game_session_id,
        models.PlayerResponse.question_id == question_id
    ).all()
    
    # Initialize distribution (4 options: 0-3)
    distribution = {0: 0, 1: 0, 2: 0, 3: 0}
    correct_count = 0
    total_responses = len(responses)
    
    # Get correct answer
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    correct_answer_index = question.correct_answer_index if question else None
    
    # Count answers
    for response in responses:
        if 0 <= response.answer_index <= 3:
            distribution[response.answer_index] += 1
        if response.answer_index == correct_answer_index:
            correct_count += 1
    
    return {
        "question_id": question_id,
        "total_responses": total_responses,
        "distribution": distribution,
        "correct_answer_index": correct_answer_index,
        "correct_count": correct_count,
        "accuracy": (correct_count / total_responses * 100) if total_responses > 0 else 0
    }


def end_game(db: Session, game_session_id: int) -> bool:
    """
    End a game session.
    
    Args:
        db: Database session
        game_session_id: ID of the game session
    
    Returns:
        True if successful, False otherwise
    """
    game_session = db.query(models.GameSession).filter(
        models.GameSession.id == game_session_id
    ).first()
    
    if not game_session:
        return False
    
    game_session.status = "finished"
    game_session.ended_at = datetime.now(timezone.utc)
    db.commit()
    
    return True

