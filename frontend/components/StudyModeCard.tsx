import React, { ReactNode } from "react";

interface StudyModeCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
    gradientColors: {
        from: string; // e.g., 'from-purple-500'
        to: string; // e.g., 'to-purple-700'
        hoverFrom: string; // e.g., 'hover:from-purple-600'
        hoverTo: string; // e.g., 'hover:to-purple-800'
        ring: string; // e.g., 'purple-400' (Tailwind might need full class like 'focus:ring-purple-400')
    };
    textColorClass?: string; // Optional: e.g., 'text-purple-200'
}

export default function StudyModeCard({
    title,
    description,
    icon,
    onClick,
    gradientColors,
    textColorClass = "text-gray-200", // Default text color
}: StudyModeCardProps) {
    // Construct gradient classes directly
    // Ensure full class names are generated if JIT issues occur, especially for hover and ring states.
    const baseClasses =
        "study-mode-box p-6 sm:p-8 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 flex flex-col items-center justify-center aspect-[4/3] sm:aspect-video";
    const gradientStyleClasses = `bg-gradient-to-br ${gradientColors.from} ${gradientColors.to} ${gradientColors.hoverFrom} ${gradientColors.hoverTo}`;
    const ringStyleClass = `focus:ring-${gradientColors.ring}`; // This might need to be a direct full class name if JIT has issues

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${gradientStyleClasses} ${ringStyleClass}`}
        >
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-2xl sm:text-3xl font-bold">{title}</h3>
            <p className={`text-sm mt-1 ${textColorClass}`}>{description}</p>
        </button>
    );
}
