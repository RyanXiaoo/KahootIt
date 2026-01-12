"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function CreateKahootPage() {
    const { token, isLoading: authIsLoading, isAuthenticated } = useAuth();

    const [quizTitle, setQuizTitle] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [startPage, setStartPage] = useState("");
    const [endPage, setEndPage] = useState("");
    const [maxTotalQuestions, setMaxTotalQuestions] = useState("10");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        if (!authIsLoading && !isAuthenticated) {
            setError("You are not logged in. Please log in to create a quiz.");
        }
        if (!authIsLoading && isAuthenticated) {
            setError(null);
        }
    }, [authIsLoading, isAuthenticated]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setPdfFile(event.target.files[0]);
        } else {
            setPdfFile(null);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (authIsLoading) {
            setError("Authentication is still loading. Please wait.");
            return;
        }

        if (!isAuthenticated || !token) {
            setError("You are not logged in. Please log in to create a quiz.");
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        if (!quizTitle.trim()) {
            setError("Quiz title is required.");
            setIsSubmitting(false);
            return;
        }
        if (!pdfFile) {
            setError("Please select a PDF file.");
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append("quiz_custom_title", quizTitle.trim());
        formData.append("file", pdfFile);
        if (startPage) formData.append("start_page", startPage);
        if (endPage) formData.append("end_page", endPage);
        if (maxTotalQuestions)
            formData.append("max_total_questions", maxTotalQuestions);

        try {
            const response = await fetch(
                "http://localhost:8000/upload-notes/",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.detail || `HTTP error! status: ${response.status}`
                );
            }

            setSuccessMessage(
                `Quiz "${result.quiz_title}" created successfully! Redirecting...`
            );
            
            // Redirect to the quiz page after a short delay
            setTimeout(() => {
                router.push(`/quiz/${result.quiz_id}`);
            }, 1500);
            setStartPage("");
            setEndPage("");
            setMaxTotalQuestions("10");
        } catch (err: any) {
            console.error("Failed to create quiz:", err);
            setError(
                err.message || "An unexpected error occurred. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authIsLoading && !error) {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-white text-lg">Loading...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pt-8">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black text-white mb-3" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        Create Kahoot
                    </h1>
                </div>

                {/* Form Card */}
                <div className="w-full bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="quizTitle"
                                className="block mb-2 text-sm font-semibold text-gray-700"
                            >
                                Quiz Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="quizTitle"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-400 transition-colors text-base"
                                placeholder="e.g., Chapter 1 Review"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="pdfFile"
                                className="block mb-2 text-sm font-semibold text-gray-700"
                            >
                                Upload PDF Notes <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                id="pdfFile"
                                onChange={handleFileChange}
                                accept=".pdf"
                                required
                                className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded file:border-0
                           file:text-sm file:font-semibold
                           file:bg-purple-50 file:text-purple-700
                           hover:file:bg-purple-100 file:cursor-pointer"
                            />
                            {pdfFile && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Selected: {pdfFile.name}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label
                                    htmlFor="startPage"
                                    className="block mb-2 text-sm font-semibold text-gray-700"
                                >
                                    Start Page
                                </label>
                                <input
                                    type="number"
                                    id="startPage"
                                    value={startPage}
                                    onChange={(e) => setStartPage(e.target.value)}
                                    min="1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-400 transition-colors text-base"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="endPage"
                                    className="block mb-2 text-sm font-semibold text-gray-700"
                                >
                                    End Page
                                </label>
                                <input
                                    type="number"
                                    id="endPage"
                                    value={endPage}
                                    onChange={(e) => setEndPage(e.target.value)}
                                    min={startPage || "1"}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-400 transition-colors text-base"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="maxTotalQuestions"
                                className="block mb-2 text-sm font-semibold text-gray-700"
                            >
                                Total Questions
                            </label>
                            <input
                                type="number"
                                id="maxTotalQuestions"
                                value={maxTotalQuestions}
                                onChange={(e) => setMaxTotalQuestions(e.target.value)}
                                min="1"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-400 transition-colors text-base"
                                placeholder="10"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-green-600 text-sm">{successMessage}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                isSubmitting || authIsLoading || !isAuthenticated
                            }
                            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Creating..." : "Create Kahoot"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
