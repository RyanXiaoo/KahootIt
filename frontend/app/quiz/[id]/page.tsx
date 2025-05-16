"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext"; // Adjust path if context is elsewhere

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

    // Placeholder functions for mode selection - to be implemented later
    const handleFlashcardsClick = () => {
        console.log("Flashcards mode selected for quiz:", quizData.quiz_id);
        // Here you would navigate to a flashcards view or update state to show flashcards
    };

    const handleLearnClick = () => {
        console.log("Learn mode selected for quiz:", quizData.quiz_id);
        // Here you would navigate to a learn view or update state to show learn mode
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
                    {/* Flashcards Box */}
                    <button
                        onClick={handleFlashcardsClick}
                        className="study-mode-box bg-gradient-to-br from-[#5424a2] to-[#1e1b4b] p-6 sm:p-8 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 flex flex-col items-center justify-center aspect-[4/3] sm:aspect-video"
                    >
                        {/* Placeholder for an icon - you can add an SVG or an image here */}
                        <div className="text-6xl mb-4">🗂️</div>
                        <h3 className="text-2xl sm:text-3xl font-bold">
                            Flashcards
                        </h3>
                        <p className="text-sm text-purple-200 mt-1">
                            Review terms and concepts.
                        </p>
                    </button>

                    {/* Learn Box */}
                    <button
                        onClick={handleLearnClick}
                        className="study-mode-box bg-gradient-to-br from-[#5424a2] to-[#1e1b4b] p-6 sm:p-8 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:ring-opacity-50 flex flex-col items-center justify-center aspect-[4/3] sm:aspect-video"
                    >
                        {/* Placeholder for an icon */}
                        <div className="text-6xl mb-4">💡</div>
                        <h3 className="text-2xl sm:text-3xl font-bold">
                            Learn
                        </h3>
                        <p className="text-sm text-indigo-200 mt-1">
                            Test your knowledge.
                        </p>
                    </button>
                </div>

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
