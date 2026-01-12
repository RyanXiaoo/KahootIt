"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        const value = e.target.value.replace(/\D/g, "");
        setPin(value);
        setError("");
    };

    const handleJoinGame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!pin || pin.length < 4) {
            setError("Please enter a valid game PIN");
            return;
        }

        // Navigate to game lobby
        router.push(`/play/${pin}/lobby`);
    };

    return (
        <main className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
            {/* Sign In Button - Top Right */}
            <div className="absolute top-6 right-6 z-10">
                <Link
                    href="/login"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 transition cursor-pointer inline-block"
                >
                    <span className="text-white font-semibold text-sm">Sign In</span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
                {/* Kahoot Logo */}
                <h1 className="text-7xl font-black text-white mb-16 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    KahootIt!
                </h1>

                {/* PIN Entry Card */}
                <div className="w-full bg-white rounded-2xl shadow-2xl p-6">
                    <form onSubmit={handleJoinGame} className="space-y-3">
                        <div>
                            <input
                                type="text"
                                id="pin"
                                inputMode="numeric"
                                value={pin}
                                onChange={handlePinChange}
                                className="w-full text-center text-2xl font-bold px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-gray-300 transition-colors placeholder:text-gray-400 placeholder:text-2xl placeholder:font-semibold"
                                placeholder="Game PIN"
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-500 text-xs text-center mt-2">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-6 bg-black hover:bg-gray-900 text-white font-bold rounded transition-colors duration-200"
                        >
                            Enter
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
