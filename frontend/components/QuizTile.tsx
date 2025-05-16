"use client"; // Can be a client component if it uses hooks, or a server component if not.

import Link from "next/link";

// Define the expected shape of the quiz prop
interface Quiz {
    id: string;
    title: string;
    questionCount: number;
    dateCreated: string;
    // Add any other properties your quiz object might have
}

interface QuizTileProps {
    quiz: Quiz;
}

export default function QuizTile({ quiz }: QuizTileProps) {
    return (
        <Link
            href={`/quiz/${quiz.id}`}
            className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 h-full flex flex-col justify-between"
        >
            <div>
                <h2
                    className="text-xl font-semibold text-indigo-700 mb-2 truncate"
                    title={quiz.title}
                >
                    {quiz.title}
                </h2>
            </div>
            <div>
                <p className="text-sm text-gray-500 mb-1">
                    Questions: {quiz.questionCount}
                </p>
                <p className="text-sm text-gray-500">
                    Created: {quiz.dateCreated}
                </p>
            </div>
        </Link>
    );
}
