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
                `Quiz "${result.quiz_title}" created successfully with ID: ${result.quiz_id}! (${result.num_questions_generated} questions)`
            );
            setQuizTitle("");
            setPdfFile(null);
            setStartPage("");
            setEndPage("");
            setMaxTotalQuestions("10");
            console.log("Quiz creation successful:", result);
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
            <div className="text-center p-10">Loading authentication...</div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl text-white font-bold mb-6 text-center">
                Create New Kahoot Quiz
            </h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 bg-white shadow-md rounded-lg p-8"
            >
                <div>
                    <label
                        htmlFor="quizTitle"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Quiz Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="quizTitle"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., Chapter 1 Review"
                    />
                </div>

                <div>
                    <label
                        htmlFor="pdfFile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Upload PDF Notes <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="file"
                        id="pdfFile"
                        onChange={handleFileChange}
                        accept=".pdf"
                        required
                        className="mt-1 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100"
                    />
                    {pdfFile && (
                        <p className="text-xs text-gray-500 mt-1">
                            Selected: {pdfFile.name}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label
                            htmlFor="startPage"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Start Page (Optional - processes from page 1 if
                            blank)
                        </label>
                        <input
                            type="number"
                            id="startPage"
                            value={startPage}
                            onChange={(e) => setStartPage(e.target.value)}
                            min="1"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g., 5"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="endPage"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            End Page (Optional - processes to end if blank)
                        </label>
                        <input
                            type="number"
                            id="endPage"
                            value={endPage}
                            onChange={(e) => setEndPage(e.target.value)}
                            min={startPage || "1"}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g., 20"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="maxTotalQuestions"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Total Questions to Generate (Default: 10)
                    </label>
                    <input
                        type="number"
                        id="maxTotalQuestions"
                        value={maxTotalQuestions}
                        onChange={(e) => setMaxTotalQuestions(e.target.value)}
                        min="1"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Default: 10"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">
                        {error}
                    </p>
                )}
                {successMessage && (
                    <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">
                        {successMessage}
                    </p>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={
                            isSubmitting || authIsLoading || !isAuthenticated
                        }
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isSubmitting ? "Creating..." : "Create Kahoot"}
                    </button>
                </div>
            </form>
        </div>
    );
}
