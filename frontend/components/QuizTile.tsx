"use client";

import Link from "next/link";

interface Quiz {
    id: string;
    title: string;
    questionCount: number;
    dateCreated: string;
}

interface QuizTileProps {
    quiz: Quiz;
}

export default function QuizTile({ quiz }: QuizTileProps) {
    return (
        <Link
            href={`/quiz/${quiz.id}`}
            className="group block bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 h-full flex flex-col justify-between border-2 border-transparent hover:border-purple-400"
        >
            {/* Title */}
            <div className="mb-3">
                <h2
                    className="text-2xl font-bold text-gray-800 group-hover:text-purple-700 line-clamp-2 transition-colors leading-tight"
                    title={quiz.title}
                >
                    {quiz.title}
                </h2>
            </div>

            {/* Stats Section */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-700 group-hover:text-purple-700 transition-colors">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-sm">
                        {quiz.questionCount} {quiz.questionCount === 1 ? 'Question' : 'Questions'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-purple-600 transition-colors">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{quiz.dateCreated}</span>
                </div>
            </div>

            {/* View Quiz Button - Always Visible */}
            <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-purple-600 group-hover:text-purple-700 font-semibold text-sm transition-colors">
                    <span>View Quiz</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
