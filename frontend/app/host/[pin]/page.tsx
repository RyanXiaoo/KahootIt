"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { connectSocket, disconnectSocket } from "../../../lib/websocket";
import type { Socket } from "socket.io-client";

interface GameInfo {
    pin: string;
    quiz_title: string;
    quiz_id: number;
    status: string;
    question_count: number;
}

interface Question {
    id: number;
    question_text: string;
    options: string[];
    correct_answer_index: number;
    explanation?: string;
}

export default function HostLobbyPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const pin = params.pin as string;
    
    const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [answeredPlayers, setAnsweredPlayers] = useState<string[]>([]);
    const [answerDistribution, setAnswerDistribution] = useState<{ [key: number]: number }>({ 0: 0, 1: 0, 2: 0, 3: 0 });
    const [timeLeft, setTimeLeft] = useState<number>(20);
    const [showingAnswer, setShowingAnswer] = useState(false);
    const [showingLeaderboard, setShowingLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [showingFinalResults, setShowingFinalResults] = useState(false);
    const [show3rd, setShow3rd] = useState(false);
    const [show2nd, setShow2nd] = useState(false);
    const [show1st, setShow1st] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    const socketRef = useRef<Socket | null>(null);

    // Fetch game info
    useEffect(() => {
        const fetchGameInfo = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/game/${pin}/info`);
                
                if (!response.ok) {
                    throw new Error('Game not found');
                }

                const data: GameInfo = await response.json();
                setGameInfo(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch game info:', err);
                setError('Failed to load game. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchGameInfo();
    }, [pin]);

    // Connect to WebSocket
    useEffect(() => {
        if (!gameInfo) return;

        const socket = connectSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('host_join', { pin });
        });

        socket.on('host_joined', (data: { pin: string; players: string[]; player_count: number }) => {
            setPlayers(data.players);
        });

        socket.on('player_joined', (data: { player_name: string; players: string[]; player_count: number }) => {
            setPlayers(data.players);
        });

        socket.on('player_left', (data: { player_name: string; remaining_players: string[] }) => {
            setPlayers(data.remaining_players);
        });

        socket.on('player_answered', (data: { player_name: string }) => {
            setAnsweredPlayers((prev) => {
                const updated = [...prev, data.player_name];
                // Auto-advance if all players have answered
                checkIfAllAnswered(updated);
                return updated;
            });
        });

        socket.on('answer_submitted', (data: { player_name: string; answer_index: number }) => {
            setAnswerDistribution((prev) => ({
                ...prev,
                [data.answer_index]: (prev[data.answer_index] || 0) + 1
            }));
        });

        return () => {
            if (socketRef.current) {
                disconnectSocket();
                socketRef.current = null;
            }
        };
    }, [gameInfo, pin]);

    const handleStartGame = async () => {
        if (!socketRef.current || !gameInfo) return;

        try {
            // Fetch quiz questions
            const quizResponse = await fetch(`http://localhost:8000/game/${gameInfo.quiz_id}`);
            if (!quizResponse.ok) {
                throw new Error('Failed to load questions');
            }
            const quizData = await quizResponse.json();
            setQuestions(quizData.questions);

            // Start the game (only if in lobby status)
            if (gameInfo.status === 'lobby') {
                const response = await fetch(`http://localhost:8000/api/game/${pin}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                    throw new Error(errorData.detail || 'Failed to start game');
                }

                // Emit game start event to players
                socketRef.current.emit('start_game', { pin });
            }

            // Set game as started in UI
            setGameStarted(true);
            
            // Show first question after a delay
            setTimeout(() => {
                showQuestion(0, quizData.questions);
            }, 2000);
        } catch (err: any) {
            console.error('Failed to start game:', err);
            alert(`Failed to start game: ${err.message}`);
        }
    };

    const showQuestion = (index: number, questionsArray?: Question[]) => {
        const qs = questionsArray || questions;
        if (index >= qs.length || !socketRef.current) return;

        const question = qs[index];
        setCurrentQuestionIndex(index);
        setAnsweredPlayers([]);
        setAnswerDistribution({ 0: 0, 1: 0, 2: 0, 3: 0 });
        setTimeLeft(20);

        // Start timer countdown
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    // Auto-submit incorrect answers for players who didn't answer
                    markUnansweredPlayersIncorrect();
                    // Show answer reveal
                    setShowingAnswer(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Emit question to all players
        socketRef.current.emit('show_question', {
            pin,
            question: {
                id: question.id,
                question_text: question.question_text,
                options: question.options
            },
            question_index: index,
            time_limit_ms: 20000
        });
    };

    const markUnansweredPlayersIncorrect = async () => {
        if (!questions[currentQuestionIndex]) return;
        
        // Find players who haven't answered
        const unansweredPlayers = players.filter(p => !answeredPlayers.includes(p));
        
        // Submit incorrect answers for them
        for (const playerName of unansweredPlayers) {
            try {
                await fetch(`http://localhost:8000/api/game/${pin}/answer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        player_name: playerName,
                        question_id: questions[currentQuestionIndex].id.toString(),
                        answer_index: '-1', // -1 indicates no answer/timeout
                        time_taken_ms: '20000', // Full time elapsed
                    }),
                });
            } catch (err) {
                console.error(`Failed to mark ${playerName} as unanswered:`, err);
            }
        }
    };

    const handleNextQuestion = async () => {
        if (!showingAnswer) {
            // If answer isn't showing yet, reveal it first
            if (timerRef.current) clearInterval(timerRef.current);
            await markUnansweredPlayersIncorrect();
            setShowingAnswer(true);
            return;
        }

        // After showing answer, show leaderboard
        if (!showingLeaderboard) {
            await fetchLeaderboard();
            setShowingLeaderboard(true);
            return;
        }

        // Reset states and move to next question
        setShowingAnswer(false);
        setShowingLeaderboard(false);
        
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            // Small delay before showing next question
            setTimeout(() => {
                showQuestion(nextIndex);
            }, 500);
        } else {
            handleEndGame();
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/game/${pin}/leaderboard`);
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data.leaderboard || []);
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        }
    };

    const checkIfAllAnswered = (answeredList: string[]) => {
        // If all players have answered and answer isn't shown yet
        if (answeredList.length === players.length && players.length > 0 && !showingAnswer) {
            // Auto-advance when all players have answered
            // Stop timer
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeLeft(0);
            // Show answer reveal
            setShowingAnswer(true);
        }
    };

    const handleEndGame = async () => {
        if (!socketRef.current) return;

        try {
            const response = await fetch(`http://localhost:8000/api/game/${pin}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to end game');
            }

            const data = await response.json();
            setLeaderboard(data.final_leaderboard || []);
            
            socketRef.current.emit('end_game', {
                pin,
                final_leaderboard: data.final_leaderboard
            });

            // Show final results with animations
            setShowingFinalResults(true);
            setTimeout(() => setShow3rd(true), 500);
            setTimeout(() => setShow2nd(true), 1200);
            setTimeout(() => setShow1st(true), 2000);
            setTimeout(() => setShowConfetti(true), 2800);
        } catch (err) {
            console.error('Failed to end game:', err);
            alert('Failed to end game. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-4"></div>
                    <p className="text-2xl text-white font-semibold">Loading game...</p>
                </div>
            </div>
        );
    }

    if (error || !gameInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-3xl font-bold text-white mb-4">Error</h2>
                    <p className="text-xl text-white/80 mb-8">{error || 'Game not found'}</p>
                    <button
                        onClick={() => router.push('/my-kahoots')}
                        className="px-6 py-3 bg-white text-purple-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Back to My Kahoots
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen relative overflow-hidden ${gameStarted ? 'bg-white' : ''}`}>
            {/* PIN Display Card - Absolutely Centered at Top (only show in lobby) */}
            {!gameStarted && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden inline-flex">
                        {/* Join Info Section */}
                        <div className="px-8 py-6 bg-gray-50 flex items-center">
                            <div className="text-left">
                                <p className="text-sm text-gray-600 mb-1">Join at <strong>www.kahootit.it</strong></p>
                                <p className="text-sm text-gray-600">or with the <strong>KahootIt! app</strong></p>
                            </div>
                        </div>
                        
                        {/* Game PIN Section */}
                        <div className="px-8 py-6 bg-white flex items-center border-l-4 border-gray-200">
                            <div>
                                <p className="text-sm text-gray-600 font-semibold mb-1">Game PIN:</p>
                                <p className="text-5xl font-black tracking-wider text-gray-900">{pin}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Controls - Top Right (only show in lobby) */}
            {!gameStarted && (
                <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
                <button 
                    onClick={() => router.push(`/quiz/${gameInfo.quiz_id}`)}
                    className="w-12 h-12 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
                    title="Back to Quiz"
                >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <button
                    onClick={handleStartGame}
                    disabled={players.length === 0}
                    className="px-8 py-3 bg-white/90 hover:bg-white text-gray-900 font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/90"
                >
                    Start
                </button>
            </div>
            )}

            {/* Center content below PIN */}
            <div className={`flex flex-col items-center px-4 ${gameStarted ? 'justify-start pt-6' : 'justify-center min-h-screen pt-32'}`}>
                        {/* Quiz title badge */}
                        {!gameStarted && gameInfo.quiz_title && (
                            <div className="bg-white/20 backdrop-blur-md px-8 py-3 rounded-full border-2 border-white/40 mb-8">
                                <p className="text-white font-semibold text-lg">{gameInfo.quiz_title}</p>
                            </div>
                        )}

                        {/* Final Results Podium */}
                        {showingFinalResults && (
                            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#46178f] p-8 overflow-hidden">
                                {/* Confetti */}
                                {showConfetti && (
                                    <div className="absolute inset-0 pointer-events-none z-50">
                                        {[...Array(100)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute animate-confetti"
                                                style={{
                                                    left: `${Math.random() * 100}%`,
                                                    top: '-10px',
                                                    animationDelay: `${Math.random() * 3}s`,
                                                    animationDuration: `${3 + Math.random() * 2}s`,
                                                }}
                                            >
                                                <div
                                                    className={`w-4 h-4 ${
                                                        ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-pink-500', 'bg-white'][
                                                            Math.floor(Math.random() * 6)
                                                        ]
                                                    } transform rotate-45`}
                                                ></div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <h1 className="text-7xl font-black text-white text-center mb-12 animate-pulse">
                                    🏆 Winners! 🏆
                                </h1>

                                {/* Podium */}
                                <div className="flex items-end justify-center gap-6 mb-12">
                                    {/* 2nd Place */}
                                    {leaderboard[1] && (
                                        <div className={`flex flex-col items-center transition-all duration-700 ${show2nd ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
                                            <div className="mb-4 text-center transform hover:scale-110 transition-transform">
                                                <div className="text-7xl mb-3">🥈</div>
                                                <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl">
                                                    <p className="text-2xl font-black text-gray-800">{leaderboard[1].player_name}</p>
                                                    <p className="text-xl font-bold text-gray-600">{leaderboard[1].total_points} points</p>
                                                </div>
                                            </div>
                                            <div className="w-52 h-48 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                                                <span className="text-8xl font-black text-white drop-shadow-lg">2</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 1st Place */}
                                    {leaderboard[0] && (
                                        <div className={`flex flex-col items-center transition-all duration-700 ${show1st ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-32 opacity-0 scale-75'}`}>
                                            <div className="mb-4 text-center transform hover:scale-110 transition-transform">
                                                <div className="text-9xl mb-3 animate-bounce">🥇</div>
                                                <div className="bg-white rounded-2xl px-8 py-5 shadow-2xl border-4 border-yellow-400">
                                                    <p className="text-4xl font-black text-gray-800">{leaderboard[0].player_name}</p>
                                                    <p className="text-2xl font-bold text-yellow-600">{leaderboard[0].total_points} points</p>
                                                </div>
                                            </div>
                                            <div className="w-52 h-64 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                                                <span className="text-9xl font-black text-white drop-shadow-lg">1</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3rd Place */}
                                    {leaderboard[2] && (
                                        <div className={`flex flex-col items-center transition-all duration-700 ${show3rd ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
                                            <div className="mb-4 text-center transform hover:scale-110 transition-transform">
                                                <div className="text-7xl mb-3">🥉</div>
                                                <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl">
                                                    <p className="text-2xl font-black text-gray-800">{leaderboard[2].player_name}</p>
                                                    <p className="text-xl font-bold text-orange-600">{leaderboard[2].total_points} points</p>
                                                </div>
                                            </div>
                                            <div className="w-52 h-40 bg-gradient-to-t from-orange-700 to-orange-500 rounded-t-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                                                <span className="text-8xl font-black text-white drop-shadow-lg">3</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Back to Quiz Button */}
                                <button
                                    onClick={() => router.push(`/quiz/${gameInfo?.quiz_id}`)}
                                    className="px-12 py-4 bg-white text-purple-700 font-black text-2xl rounded-xl shadow-2xl hover:bg-gray-100 transition-colors"
                                >
                                    Back to Quiz →
                                </button>
                            </div>
                        )}

                        {/* Leaderboard Screen */}
                        {showingLeaderboard && !showingFinalResults && (
                            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#46178f] p-8">
                                <h1 className="text-6xl font-black text-white mb-12">Top 3</h1>
                                
                                <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8">
                                    <div className="space-y-4">
                                        {leaderboard.slice(0, 3).map((player, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center justify-between p-4 rounded-xl ${
                                                    index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                                                    index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                                                    index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                                                    'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`text-3xl font-black ${
                                                        index === 0 ? 'text-yellow-600' :
                                                        index === 1 ? 'text-gray-600' :
                                                        index === 2 ? 'text-orange-600' :
                                                        'text-gray-800'
                                                    }`}>
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${player.rank}.`}
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-800">
                                                        {player.player_name}
                                                    </div>
                                                </div>
                                                <div className="text-3xl font-black text-purple-600">
                                                    {player.total_points}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleNextQuestion}
                                    className="mt-8 px-12 py-4 bg-white text-purple-700 font-black text-2xl rounded-xl shadow-2xl hover:bg-gray-100 transition-colors"
                                >
                                    Continue →
                                </button>
                            </div>
                        )}

                        {/* Game Started - Show Current Question */}
                        {gameStarted && questions.length > 0 && !showingLeaderboard && (
                            <div className="fixed inset-0 flex flex-col bg-white">
                                {/* Question Header */}
                                <div className="bg-white shadow-md px-8 py-4">
                                    <h2 className="text-2xl font-bold text-gray-800 text-center">
                                        {questions[currentQuestionIndex]?.question_text}
                                    </h2>
                                </div>

                                {/* Content placeholder */}
                                <div className="flex-1 flex items-center justify-center p-4 relative">
                                    {/* Timer - Left side */}
                                    <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
                                        <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center shadow-2xl">
                                            <span className="text-5xl font-black text-white">{timeLeft}</span>
                                        </div>
                                    </div>

                                    {/* Unanswered counter - Right side */}
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-center">
                                        <p className="text-sm font-semibold text-gray-600 mb-1">Remaining</p>
                                        <p className="text-5xl font-black text-gray-800">
                                            {players.length - answeredPlayers.length}
                                        </p>
                                    </div>

                                    <div className="w-full max-w-4xl h-full max-h-96 bg-gray-200 rounded-xl flex items-center justify-center">
                                        <p className="text-gray-400 text-lg font-semibold">Media Area</p>
                                    </div>
                                </div>

                                {/* Answer Distribution Bars */}
                                <div className="grid grid-cols-2 gap-3 px-4 mb-3 flex-1 relative">
                                    {questions[currentQuestionIndex]?.options.map((option, index) => {
                                        const colors = [
                                            { bg: 'bg-red-500', icon: '▲' },
                                            { bg: 'bg-blue-500', icon: '◆' },
                                            { bg: 'bg-yellow-500', icon: '●' },
                                            { bg: 'bg-green-500', icon: '■' }
                                        ];
                                        const color = colors[index];
                                        const count = answerDistribution[index] || 0;
                                        const isCorrect = index === questions[currentQuestionIndex]?.correct_answer_index;
                                        
                                        return (
                                            <div key={index} className={`relative h-full ${showingAnswer && isCorrect ? 'z-30' : 'z-10'}`}>
                                                <div className={`${color.bg} rounded-lg px-6 py-6 text-white font-bold flex items-center justify-between h-full gap-4 ${showingAnswer && !isCorrect ? 'opacity-30' : ''} transition-opacity duration-500`}>
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="text-5xl flex-shrink-0">{color.icon}</div>
                                                        <div className="text-2xl font-bold truncate flex-1">{option}</div>
                                                    </div>
                                                    {count > 0 && (
                                                        <div className="text-5xl font-black flex-shrink-0">{count}</div>
                                                    )}
                                                </div>
                                                {showingAnswer && isCorrect && (
                                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow-lg">
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Dark overlay when showing answer */}
                                    {showingAnswer && (
                                        <div className="absolute inset-0 bg-black/40 pointer-events-none z-20 rounded-lg"></div>
                                    )}
                                </div>

                                {/* Bottom info bar */}
                                <div className="bg-gray-900 px-6 py-4 flex items-center justify-between text-white">
                                    <div className="font-semibold">
                                        {currentQuestionIndex + 1}/{questions.length}
                                    </div>
                                    <div className="font-semibold">
                                        Game PIN: {pin}
                                    </div>
                                    <button
                                        onClick={handleNextQuestion}
                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                                    >
                                        {!showingAnswer 
                                            ? 'Show Answer'
                                            : 'Show Leaderboard'
                                        }
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Waiting message (before game starts) */}
                        {!gameStarted && (
                            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl px-12 py-6 mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 text-center">
                                    Waiting for participants
                                </h1>
                            </div>
                        )}

                        {/* Player count and list (only show before game starts) */}
                        {!gameStarted && players.length > 0 && (
                            <div className="max-w-xl mx-auto">
                                <div className="flex items-center justify-center mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        {players.length} {players.length === 1 ? 'Player' : 'Players'}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center max-h-60 overflow-y-auto">
                                    {players.map((player, index) => (
                                        <div
                                            key={`${player}-${index}`}
                                            className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg font-semibold text-gray-800 text-center w-40 truncate"
                                        >
                                            {player}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {players.length === 0 && (
                            <p className="text-white/80 text-lg">No players yet. Share the PIN above!</p>
                        )}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-6 left-6 z-10">
                <div className="text-white/60 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{players.length}</span>
                </div>
            </div>

            {/* Confetti animation */}
            <style jsx>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(720deg); }
                }
                .animate-confetti {
                    animation: confetti linear forwards;
                }
            `}</style>
        </div>
    );
}
