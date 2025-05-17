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
        console.log("Flashcards mode selected for quiz:", quizData.quiz_id);
        setActiveStudyMode("flashcards");
        setIsModalOpen(true);
    };

    const handleLearnClick = () => {
        console.log("Learn mode selected for quiz:", quizData.quiz_id);
        setActiveStudyMode("learn"); // For now, also opens the modal, content will differ
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

    return (
        <div className="min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl">
                {/* Quiz Title Area */}
                <div className="mb-10 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-2 break-words">
                        {quizData.quiz_title}
                    </h1>
                    <p className="text-lg text-indigo-200">
                        Original PDF: {quizData.pdf_filename} | Total Questions:{" "}
                        {quizData.num_questions}
                    </p>
                </div>

                {/* Study Modes Section Title */}
                <div className="mb-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-indigo-100">
                        Choose a Study Mode
                    </h2>
                </div>

                {/* Mode Selection Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <StudyModeCard
                        title="Flashcards"
                        description="Review terms and concepts."
                        icon={<div className="text-6xl mb-4">🗂️</div>} // Or use an actual icon component
                        onClick={handleFlashcardsClick}
                        gradientColors={flashcardGradient}
                        textColorClass="text-purple-200"
                    />
                    <StudyModeCard
                        title="Learn"
                        description="Test your knowledge."
                        icon={<div className="text-6xl mb-4">💡</div>} // Or use an actual icon component
                        onClick={handleLearnClick}
                        gradientColors={learnGradient}
                        textColorClass="text-indigo-200"
                    />
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
