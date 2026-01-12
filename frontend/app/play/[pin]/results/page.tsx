"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface LeaderboardPlayer {
    rank: number;
    player_name: string;
    total_points: number;
    questions_answered: number;
}

export default function PlayerResultsPage() {
    const params = useParams();
    const router = useRouter();
    const pin = params.pin as string;
    
    const [playerName, setPlayerName] = useState<string>("");
    const [myRank, setMyRank] = useState<number>(0);
    const [myPoints, setMyPoints] = useState<number>(0);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedName = sessionStorage.getItem(`player_name_${pin}`);
        if (storedName) {
            setPlayerName(storedName);
        }
    }, [pin]);

    useEffect(() => {
        if (!playerName) return;

        const fetchResults = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/game/${pin}/leaderboard`);
                if (response.ok) {
                    const data = await response.json();
                    const leaderboard = data.leaderboard || [];
                    
                    // Find player's result
                    const myResult = leaderboard.find((p: LeaderboardPlayer) => p.player_name === playerName);
                    if (myResult) {
                        setMyRank(myResult.rank);
                        setMyPoints(myResult.total_points);
                    }
                    setTotalPlayers(leaderboard.length);
                }
            } catch (err) {
                console.error('Failed to fetch results:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [pin, playerName]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#46178f]">
                <div className="text-center">
                    <div className="inline-block animate-spin w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-4"></div>
                    <p className="text-2xl text-white font-semibold">Loading results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#46178f]">
            <div className="container mx-auto px-4 py-12 text-center">
                {/* Stats Display */}
                <div className="max-w-lg mx-auto space-y-8">
                    <div>
                        <p className="text-2xl text-white/80 font-semibold mb-3">Your Rank</p>
                        <p className="text-9xl font-black text-white mb-2">#{myRank}</p>
                        <p className="text-xl text-white/70">out of {totalPlayers} players</p>
                    </div>

                    <div className="border-t-2 border-white/30 pt-8">
                        <p className="text-2xl text-white/80 font-semibold mb-3">Total Points</p>
                        <p className="text-7xl font-black text-white">{myPoints}</p>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => router.push('/')}
                    className="mt-12 px-12 py-4 bg-white text-purple-700 font-bold text-xl rounded-xl shadow-xl hover:bg-gray-100 transition-colors"
                >
                    Exit Game
                </button>
            </div>
        </div>
    );
}

