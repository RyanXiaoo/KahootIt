"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const {
        login: authLogin,
        isLoading: authIsLoading,
        isAuthenticated,
    } = useAuth();

    useEffect(() => {
        if (!authIsLoading && isAuthenticated) {
            router.push("/my-kahoots");
        }
    }, [authIsLoading, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await loginUser(username, password);
            console.log("Login successful, token:", data.access_token);

            authLogin(data.access_token);
            router.push("/my-kahoots");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (authIsLoading || isAuthenticated) {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-white text-lg">Loading...</p>
            </main>
        );
    }

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
                        Sign In
                    </h1>
                </div>

                {/* Login Card */}
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
                                placeholder="Enter your username"
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
                                placeholder="Enter your password"
                            />
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>

                        <div className="pt-4 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-600">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/register"
                                    className="text-purple-600 hover:text-purple-700 font-semibold"
                                >
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}

