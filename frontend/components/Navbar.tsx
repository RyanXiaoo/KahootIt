"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext"; // Adjust path if your context is elsewhere

export default function Navbar() {
    const { isAuthenticated, logout, isLoading } = useAuth();

    const handleLogout = () => {
        logout(); // AuthContext's logout should handle redirecting to login page ('/')
    };

    // If loading auth state, or if user is not authenticated, render nothing.
    if (isLoading || !isAuthenticated) {
        return null;
    }

    // Only render Navbar if authenticated and not loading
    return (
        <header className="bg-custom-gray text-white p-4 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo - Far Left - Non-navigational when logged in */}
                <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="px-24 text-2xl font-extrabold transition-colors cursor-default"
                >
                    KahootIt!
                </a>

                {/* Navigation Links - Far Right */}
                <nav className="px-24">
                    <ul className="flex items-center space-x-4 sm:space-x-14">
                        <li>
                            <Link
                                href="/my-kahoots"
                                className="hover:text-indigo-200 transition-colors font-medium"
                            >
                                Kahoots
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/create-kahoot"
                                className="hover:text-indigo-200 transition-colors font-medium"
                            >
                                Create
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out text-sm"
                            >
                                Logout
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
