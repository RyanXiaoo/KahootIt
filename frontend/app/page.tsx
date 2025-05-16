"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";
export default function HomePage() {
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
            <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-indigo-700">
                <p className="text-white">Loading...</p>
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="text-center mb-10">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight">
                    KahootIt!
                </h1>
                <p className="mt-3 text-lg sm:text-xl text-indigo-200">
                    Turn your PDF notes into Kahoots
                </p>
            </div>

            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="space-y-0">
                        <div>
                            <label
                                htmlFor="username"
                                className="block mb-2 text-sm font-medium text-gray-700"
                            >
                                Username:
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block mt-3 mb-2 text-sm font-medium text-gray-700"
                            >
                                Password:
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="h-2 text-sm my-2">
                        {error && <p className="text-red-600 ">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-6 text-sm text-center text-gray-600">
                    Don&apos;t have an account?{" "}
                    <a
                        href="/register"
                        className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                    >
                        Register here
                    </a>
                </div>
            </div>
        </main>
    );
}
