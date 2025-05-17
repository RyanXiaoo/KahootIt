"use client";

import React, { useState, useEffect } from "react";

// Assuming Question interface is similar to the one in quiz/[id]/page.tsx
interface Question {
    id: number;
    question_text: string;
    options: string[];
    correct_answer_index: number;
    explanation?: string;
}

interface LearnInterfaceProps {
    questions: Question[];
    quizTitle: string;
    onClose?: () => void;
}

const optionColors = [
    "bg-red-500 hover:bg-red-600", // Red
    "bg-blue-500 hover:bg-blue-600", // Blue
    "bg-yellow-500 hover:bg-yellow-600", // Yellow
    "bg-green-500 hover:bg-green-600", // Green
];

const optionSymbols = ["▲", "◆", "●", "■"]; // Triangle, Diamond, Circle, Square (example symbols)

export default function LearnInterface({
    questions,
    quizTitle,
    onClose,
}: LearnInterfaceProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<
        number | null
    >(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [score, setScore] = useState(0);
    const [sessionComplete, setSessionComplete] = useState(false);

    useEffect(() => {
        // Reset state if questions change (e.g., new quiz loaded into learn mode)
        setCurrentQuestionIndex(0);
        setSelectedOptionIndex(null);
        setShowAnswer(false);
        setScore(0);
        setSessionComplete(questions.length === 0);
    }, [questions]);

    if (sessionComplete && questions.length > 0) {
        return (
            <div className="relative flex flex-col items-center justify-center w-full p-4 text-center text-gray-800">
                <div className="bg-white p-10 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold text-indigo-600 mb-4">
                        Quiz Complete!
                    </h2>
                    <p className="text-xl text-gray-700 mb-2">{quizTitle}</p>
                    <p className="text-2xl text-gray-700 mb-6">
                        Your score: {score} out of {questions.length}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-lg font-semibold"
                    >
                        Finish
                    </button>
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="relative flex flex-col items-center justify-center w-full p-4 text-center text-gray-800">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 transition-colors z-20 p-2"
                        aria-label="Close learn mode"
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
                <p className="text-xl bg-white p-10 rounded-lg shadow-lg">
                    No questions available for this quiz.
                </p>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionClick = (index: number) => {
        if (showAnswer) return; // Don\'t allow changing answer after submission
        setSelectedOptionIndex(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedOptionIndex === null) return; // Require an option to be selected

        setShowAnswer(true);
        if (selectedOptionIndex === currentQuestion.correct_answer_index) {
            setScore((prevScore) => prevScore + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
            setSelectedOptionIndex(null);
            setShowAnswer(false);
        } else {
            // Last question answered, quiz is complete
            setSessionComplete(true);
        }
    };

    // Determine button text and action
    const ButtonAction = () => {
        if (!showAnswer) {
            return (
                <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOptionIndex === null}
                    className="w-full sm:w-auto mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                >
                    Submit Answer
                </button>
            );
        } else {
            return (
                <button
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto mt-8 px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors text-lg"
                >
                    {currentQuestionIndex < questions.length - 1
                        ? "Next Question"
                        : "Finish Quiz"}
                </button>
            );
        }
    };

    return (
        <div className="relative flex flex-col h-full max-h-[90vh] w-full max-w-3xl mx-auto p-4 sm:p-6 bg-gray-800 text-white rounded-xl shadow-2xl">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10 p-2 bg-gray-700 rounded-full"
                    aria-label="Close learn mode"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            )}

            {/* Quiz Title and Progress */}
            <div className="mb-4 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-indigo-300 truncate">
                    {quizTitle}
                </h2>
                <p className="text-sm text-gray-400">
                    Question {currentQuestionIndex + 1} of {questions.length} |
                    Score: {score}
                </p>
            </div>

            {/* Question Area */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg mb-6 min-h-[100px] flex items-center justify-center">
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-center">
                    {currentQuestion.question_text}
                </p>
            </div>

            {/* Subtitle if any (e.g. "Check all that apply") - For now, static or omitted based on image */}
            <p className="text-center text-gray-400 mb-1 text-sm">
                Choose the best answer:
            </p>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-grow">
                {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOptionIndex === index;
                    const isCorrect =
                        index === currentQuestion.correct_answer_index;
                    let optionSpecificClasses =
                        optionColors[index % optionColors.length]; // Cycle through colors

                    if (showAnswer) {
                        if (isCorrect) {
                            optionSpecificClasses =
                                "bg-green-500 ring-4 ring-white"; // Correct answer
                        } else if (isSelected && !isCorrect) {
                            optionSpecificClasses =
                                "bg-red-700 ring-4 ring-white"; // Incorrectly selected
                        } else {
                            optionSpecificClasses = "bg-gray-600 opacity-70"; // Not selected, not correct
                        }
                    } else if (isSelected) {
                        optionSpecificClasses +=
                            " ring-4 ring-offset-2 ring-offset-gray-800 ring-white"; // Selected but not yet submitted
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(index)}
                            disabled={showAnswer}
                            className={`p-4 rounded-lg text-white font-semibold text-center flex flex-col items-center justify-center transition-all duration-150 ease-in-out min-h-[100px] sm:min-h-[120px] shadow-md hover:shadow-lg focus:outline-none ${optionSpecificClasses}`}
                        >
                            {/* <span className="text-3xl mb-2">{optionSymbols[index % optionSymbols.length]}</span> */}
                            <span className="text-sm sm:text-base md:text-lg">
                                {option}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Feedback Area */}
            {showAnswer && currentQuestion.explanation && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                    <p className="font-semibold mb-1 text-indigo-300">
                        Explanation:
                    </p>
                    <p>{currentQuestion.explanation}</p>
                </div>
            )}

            {/* Action Button Area */}
            <div className="mt-auto pt-6 text-center">
                <ButtonAction />
            </div>
        </div>
    );
}
