"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext"; // Adjust path if context is elsewhere
import StudyModeCard from "../../../components/StudyModeCard"; // Import the new component
import FlashcardInterface from "../../../components/FlashcardInterface"; // Import FlashcardInterface
import LearnInterface from "../../../components/LearnInterface"; // Import LearnInterface

// Define interfaces for the data structures
interface Question {
    id: number;
    question_text: string;
    options: string[];
    correct_answer_index: number;
    explanation?: string;
}

interface QuizData {
    quiz_id: number;
    quiz_title: string;
    pdf_filename: string;
    created_at: string;
    num_questions: number;
    questions: Question[];
}

export default function QuizDetailPage() {
    const params = useParams();
    const { token } = useAuth(); // Assuming you might need token if endpoint becomes protected
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New state for modal and study mode
    const [activeStudyMode, setActiveStudyMode] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State for creating game
    const [isCreatingGame, setIsCreatingGame] = useState(false);

    const quizId = params.id; // This will be a string, e.g., "1", "2"

    useEffect(() => {
        if (!quizId) {
            setError("Quiz ID not found in URL.");
            setIsLoading(false);
            return;
        }

        // if (!token) { // Add this check if the /game/{game_id} endpoint becomes protected
        //     setError("You must be logged in to view this quiz.");
        //     setIsLoading(false);
        //     return;
        // }

        const fetchQuizDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `http://localhost:8000/game/${quizId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            // 'Authorization': `Bearer ${token}`, // Uncomment if endpoint is protected
                        },
                    }
                );

                if (!response.ok) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ detail: "Failed to load quiz data." }));
                    throw new Error(
                        errorData.detail ||
                            `HTTP error! status: ${response.status}`
                    );
                }
                const data: QuizData = await response.json();
                setQuizData(data);
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizDetails();
    }, [quizId, token]); // Add token to dependency array if used

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="text-xl text-gray-300">Loading quiz...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="container mx-auto p-4 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
            >
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    if (!quizData) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="text-xl text-gray-300">
                    Quiz not found or no data available.
                </p>
            </div>
        );
    }

    const handleFlashcardsClick = () => {
        setActiveStudyMode("flashcards");
        setIsModalOpen(true);
    };

    const handleLearnClick = () => {
        setActiveStudyMode("learn");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setActiveStudyMode(null);
    };

    const flashcardGradient = {
        from: "from-[#5424a2]", // Your custom purple
        to: "to-[#1e1b4b]", // Your custom dark indigo/purple
        hoverFrom: "hover:from-[#6a3bb5]", // Slightly lighter hover
        hoverTo: "hover:to-[#2f2a6d]", // Slightly lighter hover
        ring: "purple-400",
    };

    const learnGradient = {
        from: "from-[#5424a2]", // Using same gradient for now, can be different
        to: "to-[#1e1b4b]",
        hoverFrom: "hover:from-[#6a3bb5]",
        hoverTo: "hover:to-[#2f2a6d]",
        ring: "indigo-400",
    };

    const handleHostGameClick = async () => {
        setIsCreatingGame(true);

        try {
            const response = await fetch('http://localhost:8000/api/game/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quiz_id: quizData.quiz_id })
            });

            if (!response.ok) {
                throw new Error('Failed to create game');
            }

            const data = await response.json();
            // Navigate to host lobby with the PIN
            window.location.href = `/host/${data.pin}`;
        } catch (err) {
            console.error('Failed to create game:', err);
            alert('Failed to create game. Please try again.');
        } finally {
            setIsCreatingGame(false);
        }
    };

    return (
        <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 pt-8">
            <div className="w-full max-w-5xl mx-auto">
                {/* Quiz Title Area */}
                <div className="mb-8 text-center">
                    <h1 className="text-5xl sm:text-6xl font-black mb-4 break-words" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {quizData.quiz_title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-white/70 text-sm">
                        <span>{quizData.pdf_filename}</span>
                        <span>•</span>
                        <span>{quizData.num_questions} Questions</span>
                    </div>
                </div>

                {/* Host Game Button */}
                <div className="mb-10 text-center">
                    <button
                        onClick={handleHostGameClick}
                        disabled={isCreatingGame}
                        className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreatingGame ? 'Creating Game...' : 'Host Live Game'}
                    </button>
                </div>

                {/* Study Modes Section */}
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-semibold text-white/90">
                        Choose a Study Mode
                    </h2>
                </div>

                {/* Mode Selection Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Flashcards Card */}
                    <button
                        onClick={handleFlashcardsClick}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-400 transition-colors">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Flashcards</h3>
                            <p className="text-white/70 text-sm">Review terms and concepts</p>
                        </div>
                    </button>

                    {/* Learn Card */}
                    <button
                        onClick={handleLearnClick}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-400 transition-colors">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Learn</h3>
                            <p className="text-white/70 text-sm">Test your knowledge</p>
                        </div>
                    </button>
                </div>

                {/* Modal Rendering */}
                {isModalOpen && quizData && activeStudyMode && (
                    <div className="fixed inset-0 bg-gradient-to-br from-[#5424a2] to-[#1e1b4b] flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div
                            className={`my-auto ${
                                activeStudyMode === "learn"
                                    ? "w-full max-w-3xl"
                                    : "max-w-2xl w-full"
                            }`}
                        >
                            {activeStudyMode === "flashcards" && (
                                <FlashcardInterface
                                    questions={quizData.questions}
                                    onClose={closeModal}
                                />
                            )}
                            {activeStudyMode === "learn" && (
                                <LearnInterface
                                    questions={quizData.questions}
                                    quizTitle={quizData.quiz_title}
                                    onClose={closeModal}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Optional: Display full question list for debugging or direct access - can be removed */}
                {/* 
                <div className="mt-12 p-6 bg-gray-800 rounded-lg shadow-xl">
                    <h3 className="text-2xl font-semibold text-indigo-300 mb-4">All Questions (Debug View)</h3>
                    {quizData.questions.map((q, index) => (
                        <div key={q.id} className="mb-4 pb-4 border-b border-gray-700 last:border-b-0">
                            <p className="font-semibold">Q{index + 1}: {q.question_text}</p>
                            <ul className="list-disc list-inside pl-4 text-sm">
                                {q.options.map((opt, i) => (
                                    <li key={i} className={i === q.correct_answer_index ? 'text-green-400' : ''}>{opt}</li>
                                ))}
                            </ul>
                            {q.explanation && <p className="text-xs text-gray-400 mt-1">Explanation: {q.explanation}</p>}
                        </div>
                    ))}
                </div>
                */}
            </div>
        </div>
    );
}
