"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "../../lib/api";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);

        try {
            const data = await registerUser(username, password);
            setSuccessMessage(
                `Account created successfully! Redirecting to login...`
            );
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred during registration.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            {/* Back Link */}
            <Link
                href="/"
                className="absolute top-6 left-6 text-white hover:text-white/80 transition-colors flex items-center gap-1 text-sm"
            >
                <span>←</span> Back
            </Link>

            <div className="w-full max-w-md mx-auto flex flex-col items-center">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black text-white mb-3" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        Register
                    </h1>
                </div>

                {/* Register Card */}
                <div className="w-full bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="username"
                                className="block mb-2 text-sm font-semibold text-gray-700"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-400 transition-colors text-base"
                                placeholder="Choose a username"
                            />
                        </div>
                        
                        <div>
                            <label
                                htmlFor="password"
                                className="block mb-2 text-sm font-semibold text-gray-700"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-400 transition-colors text-base"
                                placeholder="Create a password"
                            />
                        </div>
                        
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block mb-2 text-sm font-semibold text-gray-700"
                            >
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-gray-400 transition-colors text-base"
                                placeholder="Confirm your password"
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
                            disabled={isLoading}
                            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Creating account..." : "Register"}
                        </button>

                        <div className="pt-4 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="text-purple-600 hover:text-purple-700 font-semibold"
                                >
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
