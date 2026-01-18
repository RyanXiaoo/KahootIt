/**
 * WebSocket Client for Real-time Game Communication
 */
import { io, Socket } from 'socket.io-client';

// Use dynamic host for WiFi play - works on localhost AND network devices
const getSocketURL = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:8000`;
    }
    return 'http://localhost:8000';
};

const SOCKET_URL = getSocketURL();

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: false,
        });
    }
    return socket;
}

export function connectSocket() {
    const socket = getSocket();
    if (!socket.connected) {
        socket.connect();
    }
    return socket;
}

export function disconnectSocket() {
    if (socket && socket.connected) {
        socket.disconnect();
    }
}

// Event types for type safety
export interface LobbyJoinedEvent {
    pin: string;
    player_name: string;
    players: string[];
}

export interface PlayerJoinedEvent {
    player_name: string;
    players: string[];
    player_count: number;
}

export interface PlayerLeftEvent {
    player_name: string;
    remaining_players: string[];
}

export interface GameStartedEvent {
    pin: string;
}

export interface QuestionShownEvent {
    question: {
        id: number;
        question_text: string;
        options: string[];
    };
    question_index: number;
    time_limit_ms: number;
}

export interface AnswerReceivedEvent {
    question_id: number;
    answer_index: number;
}

export interface LeaderboardUpdateEvent {
    leaderboard: Array<{
        rank: number;
        player_name: string;
        total_points: number;
        questions_answered: number;
    }>;
}

export interface GameEndedEvent {
    final_leaderboard: Array<{
        rank: number;
        player_name: string;
        total_points: number;
    }>;
}

export interface ErrorEvent {
    message: string;
}

