"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { connectSocket, disconnectSocket } from "../../../../lib/websocket";
import type { Socket } from "socket.io-client";

interface GameInfo {
    pin: string;
    quiz_title: string;
    status: string;
    question_count: number;
}

export default function LobbyPage() {
    const params = useParams();
    const router = useRouter();
    const pin = params.pin as string;
    
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
    const [playerName, setPlayerName] = useState("");
    const [hasJoined, setHasJoined] = useState(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    
    const socketRef = useRef<Socket | null>(null);

    // Step 1: Validate PIN with backend
    useEffect(() => {
        const validateGame = async () => {
            // Validate PIN format first
            if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
                setError("Invalid PIN format. Please enter a 6-digit PIN.");
                setIsValidating(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:8000/api/game/${pin}/info`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        setError("Game not found. The host hasn't created this game yet, or the PIN is incorrect.");
                    } else {
                        setError("Unable to connect to game. Please try again.");
                    }
                    setIsValidating(false);
                    return;
                }

                const data: GameInfo = await response.json();
                setGameInfo(data);
                setError(null);
            } catch (err) {
                console.error("Failed to validate game:", err);
                setError("Unable to connect to server. Please check your connection.");
            } finally {
                setIsValidating(false);
            }
        };

        validateGame();
    }, [pin]);

    // Step 2: Handle WebSocket connection and events
    useEffect(() => {
        if (!hasJoined || !socketRef.current) return;

        const socket = socketRef.current;

        // Listen for other players joining
        socket.on('player_joined', (data: { player_name: string; players: string[]; player_count: number }) => {
            setPlayers(data.players);
        });

        // Listen for players leaving
        socket.on('player_left', (data: { player_name: string; remaining_players: string[] }) => {
            setPlayers(data.remaining_players);
        });

        // Listen for game start
        socket.on('game_started', (data: { pin: string }) => {
            router.push(`/play/${pin}/game`);
        });

        // Listen for errors
        socket.on('error', (data: { message: string }) => {
            console.error('Socket error:', data);
            setError(data.message);
        });

        return () => {
            socket.off('player_joined');
            socket.off('player_left');
            socket.off('game_started');
            socket.off('error');
        };
    }, [hasJoined, pin, router]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                disconnectSocket();
                socketRef.current = null;
            }
        };
    }, []);

    const handleJoinLobby = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!playerName.trim()) {
            setError("Please enter your name");
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Connect to WebSocket
            const socket = connectSocket();
            socketRef.current = socket;

            // Wait for connection
            await new Promise<void>((resolve, reject) => {
                socket.on('connect', () => {
                    resolve();
                });
                socket.on('connect_error', (err) => {
                    console.error('Connection error:', err);
                    reject(err);
                });
                
                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });

            // Join the lobby
            socket.emit('join_lobby', { 
                pin: pin, 
                player_name: playerName.trim() 
            });

            // Wait for lobby joined confirmation
            await new Promise<void>((resolve, reject) => {
                socket.on('lobby_joined', (data: { pin: string; player_name: string; players: string[] }) => {
                    setPlayers(data.players);
                    setHasJoined(true);
                    // Store player name for game page
                    sessionStorage.setItem(`player_name_${pin}`, playerName.trim());
                    resolve();
                });
                
                setTimeout(() => reject(new Error('Failed to join lobby')), 5000);
            });

        } catch (err) {
            console.error('Failed to join lobby:', err);
            setError("Failed to connect to game. Please try again.");
            if (socketRef.current) {
                disconnectSocket();
                socketRef.current = null;
            }
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-2xl">

                {/* Main Content Card */}
                <div className=" p-8 rounded-3xl ">
                    {/* Loading/Validating State */}
                    {isValidating && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mb-4"></div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Connecting...
                            </h2>
                            <p className="text-gray-600">
                                Validating game PIN
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {!isValidating && error && !hasJoined && (
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <div className="text-6xl mb-4">✕</div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    Oops!
                                </h2>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    {error}
                                </p>
                            </div>
                            <div className="space-y-3">
                                <Link
                                    href="/"
                                    className="block w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
                                >
                                    Try Another PIN
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Name Entry Form */}
                    {!isValidating && !error && gameInfo && !hasJoined && (
                        <div className="py-4 max-w-md mx-auto">
                            <h2 className="text-3xl font-black text-white mb-6 text-center drop-shadow-lg">
                                Enter Your Name
                            </h2>
                            <form onSubmit={handleJoinLobby} className="space-y-4">
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Your nickname"
                                    maxLength={20}
                                    className="w-full text-center text-xl font-bold px-4 py-3 border-2 border-white/30 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all bg-white placeholder:text-gray-400"
                                    autoFocus
                                    disabled={isConnecting}
                                />
                                <button
                                    type="submit"
                                    disabled={isConnecting || !playerName.trim()}
                                    className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isConnecting ? 'Joining...' : 'Join Lobby'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Lobby - Players List */}
                    {hasJoined && (
                        <div className="py-4">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Waiting for host to start...
                                </h2>
                                <p className="text-white/80">
                                    {players.length} {players.length === 1 ? 'player' : 'players'} in lobby
                                </p>
                            </div>

                            {/* Players Grid */}
                            <div className="mb-4 max-w-xl mx-auto">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                    Players
                                </h3>
                                <div className="flex flex-wrap gap-3 justify-center max-h-60 overflow-y-auto">
                                    {players.map((player, index) => (
                                        <div
                                            key={`${player}-${index}`}
                                            className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg font-semibold text-gray-800 text-center w-40 truncate"
                                        >
                                            {player === playerName ? `${player} (You)` : player}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

