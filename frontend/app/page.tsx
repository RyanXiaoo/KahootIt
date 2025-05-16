"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../lib/api";

export default function HomePage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await loginUser(username, password);
            console.log("Login successful, token:", data.access_token);

            if (typeof window !== "undefined") {
                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem("tokenType", data.token_type);
            }

            alert("Login successful! Token: " + data.access_token);
            router.push("/dashboard");
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

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-1/2 max-w-md h-2/3 p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome to KahootIt!
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Turn your notes into Kahoots
                    </p>
                </div>

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
                                placeholder="yourusername"
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
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="h-2 text-sm my-2">
                        {error && <p className="text-red-600 ">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-3 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
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
