"use client";

import React, { useState, useEffect } from "react";

// Assuming Question interface is similar to the one in quiz/[id]/page.tsx
interface Question {
    id: number; // Keep original ID for keying if ever needed
    question_text: string;
    options: string[];
    correct_answer_index: number;
    explanation?: string;
}

interface FlashcardInterfaceProps {
    questions: Question[]; // Guaranteed to be Question[] (can be empty) by QuizDetailPage
    onClose?: () => void;
}

export default function FlashcardInterface({
    questions,
    onClose,
}: FlashcardInterfaceProps) {
    // Initialize state directly from props to avoid issues on initial render
    const [remainingCards, setRemainingCards] = useState<Question[]>([
        ...questions,
    ]);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState<boolean>(
        questions.length === 0
    );
    const [initialCardCount, setInitialCardCount] = useState<number>(
        questions.length
    );

    useEffect(() => {
        // This effect now primarily handles reset if the `questions` prop instance changes
        // and ensures `isFlipped` is reset correctly.
        // For initial load, useState initializers have already set the correct state.
        setRemainingCards([...questions]);
        setInitialCardCount(questions.length);
        setSessionComplete(questions.length === 0);
        setIsFlipped(false); // Reset flip state when deck changes/reinitializes
    }, [questions]); // Dependency on the questions prop array itself

    const handleFlip = () => {
        if (remainingCards.length === 0 || sessionComplete) return;
        setIsFlipped(!isFlipped);
    };

    const handleMarkConfident = () => {
        if (remainingCards.length === 0) return;
        setRemainingCards((prevCards) => {
            const nextDeck = prevCards.slice(1);
            if (nextDeck.length === 0) {
                setSessionComplete(true);
            }
            return nextDeck;
        });
        setIsFlipped(false);
    };

    const handleMarkNotConfident = () => {
        if (remainingCards.length === 0) return;
        setRemainingCards((prevCards) => {
            if (prevCards.length <= 1) {
                // If only one card left, marking it not confident means it stays as the only card
                // If it was the last card and they say 'again', it should remain to be tried again, not cause an error or end session.
                // No change needed to sessionComplete here; it's handled by handleMarkConfident.
                return prevCards;
            }
            const cardToMove = prevCards[0];
            return [...prevCards.slice(1), cardToMove];
        });
        setIsFlipped(false);
    };

    // Render logic based on initialized and updated state
    if (initialCardCount === 0) {
        // This means the questions prop was initially empty
        return (
            <div className="relative flex flex-col items-center justify-center w-full p-4 text-center">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-300 hover:text-white transition-colors z-20 p-2"
                        aria-label="Close flashcards"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-7 h-7 sm:w-8 sm:h-8"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
                <p className="text-xl text-gray-700 bg-white p-10 rounded-lg shadow-lg">
                    No questions available for flashcards.
                </p>
            </div>
        );
    }

    if (sessionComplete) {
        // All cards from the initial deck have been marked confident
        return (
            <div className="relative flex flex-col items-center justify-center w-full p-4 text-center">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-300 hover:text-white transition-colors z-20 p-2"
                        aria-label="Close flashcards"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-7 h-7 sm:w-8 sm:h-8"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
                <div className="bg-white p-10 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold text-green-600 mb-4">
                        Well Done!
                    </h2>
                    <p className="text-lg text-gray-700 mb-6">
                        You've reviewed all {initialCardCount} card
                        {initialCardCount === 1 ? "" : "s"}.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-lg font-semibold"
                    >
                        Finish Session
                    </button>
                </div>
            </div>
        );
    }

    // If we reach here, initialCardCount > 0 and sessionComplete is false.
    // This implies remainingCards is not empty.
    const currentQuestion = remainingCards[0];

    return (
        <div className="relative flex flex-col items-center justify-center w-full p-4 select-none">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-300 hover:text-white transition-colors z-20 p-2"
                    aria-label="Close flashcards"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-7 h-7 sm:w-8 sm:h-8"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            )}

            {/* Card Area */}
            <div
                className="relative w-full max-w-lg h-80 sm:h-96 rounded-xl p-6 cursor-pointer transition-transform duration-700 ease-in-out transform-style-preserve-3d shadow-lg border border-gray-200"
                onClick={handleFlip}
                style={{
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {/* Front of the card (Question) */}
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-white p-6 rounded-xl backface-hidden overflow-auto">
                    <p className="text-xs text-gray-500 mb-2 font-medium absolute top-4 left-4">
                        {remainingCards.length} card
                        {remainingCards.length === 1 ? "" : "s"} remaining
                    </p>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center text-gray-800 px-4">
                        {currentQuestion.question_text}
                    </h2>
                </div>

                {/* Back of the card (Answer/Explanation) */}
                <div
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-white p-6 sm:p-8 rounded-xl backface-hidden overflow-auto transform-style-preserve-3d"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <p className="text-xs text-gray-500 mb-2 font-medium absolute top-4 left-4">
                        {remainingCards.length} card
                        {remainingCards.length === 1 ? "" : "s"} remaining
                    </p>
                    {/* Display only the correct answer text */}
                    <div className="flex-grow flex flex-col items-center justify-center w-full px-4">
                        <p className="text-sm text-green-600 mb-2 font-semibold">
                            Correct Answer:
                        </p>
                        <p className="text-xl sm:text-2xl text-center text-gray-800 font-medium">
                            {
                                currentQuestion.options[
                                    currentQuestion.correct_answer_index
                                ]
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center items-center w-full max-w-xs sm:max-w-sm mt-6 space-x-3 sm:space-x-4">
                <button
                    onClick={handleMarkNotConfident}
                    className="flex flex-col items-center justify-center p-2.5 sm:p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 w-28 h-20 sm:w-32 sm:h-24"
                    disabled={remainingCards.length === 0}
                    title="I don't know this"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 sm:w-7 sm:h-7"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="text-xs sm:text-sm mt-1 font-medium">
                        Again
                    </span>
                </button>

                <button
                    onClick={handleMarkConfident}
                    className="flex flex-col items-center justify-center p-2.5 sm:p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 w-28 h-20 sm:w-32 sm:h-24"
                    disabled={remainingCards.length === 0}
                    title="I know this"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 sm:w-7 sm:h-7"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                        />
                    </svg>
                    <span className="text-xs sm:text-sm mt-1 font-medium">
                        Got it!
                    </span>
                </button>
            </div>

            {/* Helper CSS for 3D transform */}
            <style jsx global>{`
                .transform-style-preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden; /* Safari */
                }
            `}</style>
        </div>
    );
}
