"use client";

import Link from "next/link"; // Import Link for clickable tiles
import ProtectedRoute from "../../components/ProtectedRoute"; // Adjust path if necessary
import { useAuth } from "../../context/AuthContext"; // To potentially get user info later
import QuizTile from "../../components/QuizTile"; // Import the QuizTile component

// Mock data for quizzes - replace with API call later
const mockQuizzes = [
    {
        id: "1",
        title: "Introduction to Photosynthesis",
        dateCreated: "2023-10-26",
        questionCount: 15,
    },
    {
        id: "2",
        title: "World War II: Key Battles",
        dateCreated: "2023-11-05",
        questionCount: 20,
    },
    {
        id: "3",
        title: "Calculus I: Derivatives",
        dateCreated: "2023-11-12",
        questionCount: 25,
    },
    {
        id: "4",
        title: "Shakespearean Sonnets",
        dateCreated: "2023-11-18",
        questionCount: 10,
    },
    {
        id: "5",
        title: "The Human Genome Project",
        dateCreated: "2023-11-22",
        questionCount: 18,
    },
    {
        id: "6",
        title: "Basics of Python Programming",
        dateCreated: "2023-12-01",
        questionCount: 30,
    },
    {
        id: "7",
        title: "Art History: Renaissance Period",
        dateCreated: "2023-12-05",
        questionCount: 22,
    },
    {
        id: "8",
        title: "Fundamentals of Organic Chemistry",
        dateCreated: "2023-12-10",
        questionCount: 28,
    },
];

export default function MyKahootsPage() {
    // Renamed component for clarity
    const { token } = useAuth();
    // const { user } = useAuth(); // You can get the user object here once you add it to AuthContext

    // In a real app, you would fetch quizzes using the token
    // For now, we use mockQuizzes
    const quizzes = mockQuizzes;

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                        My Kahoots
                    </h1>
                </div>

                {quizzes.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-xl text-gray-500 mb-4">
                            You haven't created any Kahoots yet.
                        </p>
                        {/* Optional: A more prominent CTA if no quizzes exist */}
                        {/* <Link href="/create-kahoot" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out">
                            Create Your First Kahoot!
                        </Link> */}
                    </div>
                ) : (
                    // Grid container for quiz tiles
                    // The main scrollable area will be the page itself due to min-h-screen on layout
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {quizzes.map((quiz) => (
                            <QuizTile quiz={quiz} key={quiz.id} />
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
