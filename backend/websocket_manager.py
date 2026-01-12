"""
WebSocket Manager - Handles real-time communication for multiplayer games
"""
import socketio
from typing import Dict, Set, Optional
import logging

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Configure based on your frontend URL
    logger=True,
    engineio_logger=True
)

# Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio)

# Track active connections
# Structure: {pin: {socket_id: player_name}}
game_rooms: Dict[str, Dict[str, str]] = {}

# Track host connections
# Structure: {pin: host_socket_id}
host_connections: Dict[str, str] = {}


@sio.event
async def connect(sid, environ):
    """Handle new WebSocket connection"""
    logger.info(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    """Handle WebSocket disconnection"""
    logger.info(f"Client disconnected: {sid}")
    
    # Remove from any game rooms
    for pin, players in list(game_rooms.items()):
        if sid in players:
            player_name = players.pop(sid)
            logger.info(f"Player {player_name} left game {pin}")
            
            # Notify other players
            await sio.emit('player_left', {
                'player_name': player_name,
                'remaining_players': list(players.values())
            }, room=pin, skip_sid=sid)
            
            # Clean up empty rooms
            if not players:
                del game_rooms[pin]
    
    # Remove host connections
    for pin, host_sid in list(host_connections.items()):
        if sid == host_sid:
            del host_connections[pin]
            logger.info(f"Host disconnected from game {pin}")


@sio.event
async def join_lobby(sid, data):
    """
    Player joins a game lobby.
    Expected data: {pin: str, player_name: str}
    """
    try:
        pin = data.get('pin')
        player_name = data.get('player_name', 'Anonymous')
        
        if not pin:
            await sio.emit('error', {'message': 'PIN is required'}, room=sid)
            return
        
        # Initialize game room if it doesn't exist
        if pin not in game_rooms:
            game_rooms[pin] = {}
        
        # Add player to room
        game_rooms[pin][sid] = player_name
        await sio.enter_room(sid, pin)
        
        # Get current players
        current_players = list(game_rooms[pin].values())
        
        # Confirm join to the player
        await sio.emit('lobby_joined', {
            'pin': pin,
            'player_name': player_name,
            'players': current_players
        }, room=sid)
        
        # Notify all players in lobby
        await sio.emit('player_joined', {
            'player_name': player_name,
            'players': current_players,
            'player_count': len(current_players)
        }, room=pin)
        
        logger.info(f"Player {player_name} joined lobby {pin}")
        
    except Exception as e:
        logger.error(f"Error in join_lobby: {e}")
        await sio.emit('error', {'message': 'Failed to join lobby'}, room=sid)


@sio.event
async def host_join(sid, data):
    """
    Host joins their game room to monitor/control it.
    Expected data: {pin: str}
    """
    try:
        pin = data.get('pin')
        
        if not pin:
            await sio.emit('error', {'message': 'PIN is required'}, room=sid)
            return
        
        # Track host connection
        host_connections[pin] = sid
        await sio.enter_room(sid, pin)
        
        # Get current players
        current_players = list(game_rooms.get(pin, {}).values())
        
        await sio.emit('host_joined', {
            'pin': pin,
            'players': current_players,
            'player_count': len(current_players)
        }, room=sid)
        
        logger.info(f"Host joined game {pin}")
        
    except Exception as e:
        logger.error(f"Error in host_join: {e}")
        await sio.emit('error', {'message': 'Failed to join as host'}, room=sid)


@sio.event
async def start_game(sid, data):
    """
    Host starts the game.
    Expected data: {pin: str}
    """
    try:
        pin = data.get('pin')
        
        if not pin or host_connections.get(pin) != sid:
            await sio.emit('error', {'message': 'Not authorized to start game'}, room=sid)
            return
        
        # Broadcast game start to all players
        await sio.emit('game_started', {'pin': pin}, room=pin)
        
        logger.info(f"Game {pin} started by host")
        
    except Exception as e:
        logger.error(f"Error in start_game: {e}")
        await sio.emit('error', {'message': 'Failed to start game'}, room=sid)


@sio.event
async def show_question(sid, data):
    """
    Host shows a question to all players.
    Expected data: {pin: str, question: dict, question_index: int, time_limit_ms: int}
    """
    try:
        pin = data.get('pin')
        question = data.get('question')
        question_index = data.get('question_index')
        time_limit_ms = data.get('time_limit_ms', 20000)
        
        if not pin or host_connections.get(pin) != sid:
            await sio.emit('error', {'message': 'Not authorized'}, room=sid)
            return
        
        # Broadcast question to all players
        await sio.emit('question_shown', {
            'question': question,
            'question_index': question_index,
            'time_limit_ms': time_limit_ms
        }, room=pin)
        
        logger.info(f"Question {question_index} shown in game {pin}")
        
    except Exception as e:
        logger.error(f"Error in show_question: {e}")
        await sio.emit('error', {'message': 'Failed to show question'}, room=sid)


@sio.event
async def submit_answer(sid, data):
    """
    Player submits an answer.
    Expected data: {pin: str, question_id: int, answer_index: int, time_taken_ms: int}
    """
    try:
        pin = data.get('pin')
        question_id = data.get('question_id')
        answer_index = data.get('answer_index')
        time_taken_ms = data.get('time_taken_ms')
        
        player_name = game_rooms.get(pin, {}).get(sid, 'Unknown')
        
        # Acknowledge answer received
        await sio.emit('answer_received', {
            'question_id': question_id,
            'answer_index': answer_index
        }, room=sid)
        
        # Notify host (answer submission without revealing answer)
        if pin in host_connections:
            await sio.emit('player_answered', {
                'player_name': player_name
            }, room=host_connections[pin])
        
        logger.info(f"Player {player_name} answered question {question_id} in game {pin}")
        
    except Exception as e:
        logger.error(f"Error in submit_answer: {e}")
        await sio.emit('error', {'message': 'Failed to submit answer'}, room=sid)


@sio.event
async def update_leaderboard(sid, data):
    """
    Host broadcasts updated leaderboard to all players.
    Expected data: {pin: str, leaderboard: list}
    """
    try:
        pin = data.get('pin')
        leaderboard = data.get('leaderboard', [])
        
        if not pin or host_connections.get(pin) != sid:
            await sio.emit('error', {'message': 'Not authorized'}, room=sid)
            return
        
        # Broadcast leaderboard to all
        await sio.emit('leaderboard_update', {
            'leaderboard': leaderboard
        }, room=pin)
        
        logger.info(f"Leaderboard updated for game {pin}")
        
    except Exception as e:
        logger.error(f"Error in update_leaderboard: {e}")
        await sio.emit('error', {'message': 'Failed to update leaderboard'}, room=sid)


@sio.event
async def end_game(sid, data):
    """
    Host ends the game.
    Expected data: {pin: str, final_leaderboard: list}
    """
    try:
        pin = data.get('pin')
        final_leaderboard = data.get('final_leaderboard', [])
        
        if not pin or host_connections.get(pin) != sid:
            await sio.emit('error', {'message': 'Not authorized'}, room=sid)
            return
        
        # Broadcast game end to all
        await sio.emit('game_ended', {
            'final_leaderboard': final_leaderboard
        }, room=pin)
        
        logger.info(f"Game {pin} ended by host")
        
        # Clean up
        if pin in game_rooms:
            del game_rooms[pin]
        if pin in host_connections:
            del host_connections[pin]
        
    except Exception as e:
        logger.error(f"Error in end_game: {e}")
        await sio.emit('error', {'message': 'Failed to end game'}, room=sid)


# Helper function to get player count for a game
def get_player_count(pin: str) -> int:
    """Get number of players in a game lobby"""
    return len(game_rooms.get(pin, {}))


# Helper function to get players list
def get_players(pin: str) -> list:
    """Get list of player names in a game"""
    return list(game_rooms.get(pin, {}).values())

