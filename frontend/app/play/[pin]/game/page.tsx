"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { connectSocket, disconnectSocket } from "../../../../lib/websocket";
import type { Socket } from "socket.io-client";

interface Question {
    id: number;
    question_text: string;
    options: string[];
}

export default function GamePage() {
    const params = useParams();
    const router = useRouter();
    const pin = params.pin as string;
    
    const [playerName, setPlayerName] = useState<string>("");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionIndex, setQuestionIndex] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(20);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [score, setScore] = useState<number>(0);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [timeLimit, setTimeLimit] = useState<number>(20000);
    const [showWaiting, setShowWaiting] = useState(false);
    const [pointsEarned, setPointsEarned] = useState<number>(0);
    
    const socketRef = useRef<Socket | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Get player name from session/local storage
    useEffect(() => {
        const storedName = sessionStorage.getItem(`player_name_${pin}`);
        if (storedName) {
            setPlayerName(storedName);
        } else {
            // If no name found, redirect back to lobby
            router.push(`/play/${pin}/lobby`);
        }
    }, [pin, router]);

    // Connect to WebSocket
    useEffect(() => {
        if (!playerName) return;

        const socket = connectSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
            // Rejoin the game room
            socket.emit('join_lobby', { 
                pin: pin, 
                player_name: playerName 
            });
        });

        // Listen for questions
        socket.on('question_shown', (data: { question: Question; question_index: number; time_limit_ms: number }) => {
            setCurrentQuestion(data.question);
            setQuestionIndex(data.question_index);
            setTimeLimit(data.time_limit_ms);
            setTimeLeft(data.time_limit_ms / 1000);
            setHasAnswered(false);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setShowWaiting(false);
            setPointsEarned(0);
            startTimeRef.current = Date.now();
        });

        // Listen for game end
        socket.on('game_ended', (data: { final_leaderboard: any[] }) => {
            router.push(`/play/${pin}/results`);
        });

        return () => {
            if (socketRef.current) {
                disconnectSocket();
                socketRef.current = null;
            }
        };
    }, [playerName, pin, router]);

    // Timer countdown
    useEffect(() => {
        if (!currentQuestion || hasAnswered) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [currentQuestion, hasAnswered]);

    const handleAnswerClick = async (answerIndex: number) => {
        if (hasAnswered || !currentQuestion) return;

        setSelectedAnswer(answerIndex);
        setHasAnswered(true);
        setShowWaiting(true);

        const timeTaken = Date.now() - startTimeRef.current;

        // Submit answer to backend
        try {
            const response = await fetch(`http://localhost:8000/api/game/${pin}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    player_name: playerName,
                    question_id: currentQuestion.id.toString(),
                    answer_index: answerIndex.toString(),
                    time_taken_ms: timeTaken.toString(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setIsCorrect(data.is_correct);
                setPointsEarned(data.points_earned);
                setScore((prev) => prev + data.points_earned);
                
                // Show result after 2 seconds
                setTimeout(() => {
                    setShowWaiting(false);
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to submit answer:', err);
            setShowWaiting(false);
        }

        // Also emit via WebSocket
        if (socketRef.current) {
            socketRef.current.emit('submit_answer', {
                pin,
                question_id: currentQuestion.id,
                answer_index: answerIndex,
                time_taken_ms: timeTaken,
            });
        }
    };

    const answerColors = [
        { bg: 'bg-red-500', hover: 'hover:bg-red-600', icon: '▲', name: 'Triangle' },
        { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', icon: '◆', name: 'Diamond' },
        { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', icon: '●', name: 'Circle' },
        { bg: 'bg-green-500', hover: 'hover:bg-green-600', icon: '■', name: 'Square' },
    ];

    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-4"></div>
                    <p className="text-2xl text-white font-semibold">Waiting for next question...</p>
                </div>
            </div>
        );
    }

    // Waiting screen after answer submitted
    if (showWaiting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
                <div className="text-center">
                    <div className="inline-block animate-spin w-24 h-24 border-8 border-white/30 border-t-white rounded-full mb-6"></div>
                    <p className="text-3xl text-white font-bold">Waiting for results...</p>
                </div>
            </div>
        );
    }

    // Result screen after waiting
    if (hasAnswered && !showWaiting && isCorrect !== null) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                <div className="text-center">
                    <div className="text-9xl mb-8">
                        {isCorrect ? '✓' : '✗'}
                    </div>
                    <h1 className="text-5xl font-black text-white mb-4">
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                    </h1>
                    {isCorrect && pointsEarned > 0 && (
                        <p className="text-3xl text-white font-bold">
                            +{pointsEarned} points
                        </p>
                    )}
                    <p className="text-2xl text-white/80 mt-4">
                        Score: {score}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-0 m-0">
            {/* Answer buttons - Full screen 2x2 grid */}
            <div className="h-screen grid grid-cols-2 gap-0 w-full">
                {currentQuestion.options.map((option, index) => {
                    const color = answerColors[index];
                    
                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswerClick(index)}
                            disabled={hasAnswered}
                            className={`
                                relative ${color.bg} ${!hasAnswered ? color.hover : ''} 
                                text-white font-bold
                                transition-colors duration-200 
                                disabled:cursor-not-allowed
                                h-full w-full
                                flex flex-col items-center justify-center gap-6
                            `}
                        >
                            <div className="text-9xl opacity-90">
                                {color.icon}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

