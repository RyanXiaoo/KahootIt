"use client";

import ProtectedRoute from "../../components/ProtectedRoute"; // Adjust path if necessary
import { useAuth } from "../../context/AuthContext"; // To potentially get user info later

export default function MyKahoots() {
    const { token } = useAuth();
    // const { user } = useAuth(); // You can get the user object here once you add it to AuthContext

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">
                    My Dashboard
                </h1>
                <div className="bg-white p-8 rounded-xl shadow-lg space-y-4">
                    <p className="text-gray-700 text-lg">
                        Welcome to your KahootIt! dashboard.
                    </p>
                    <p className="text-gray-600">
                        This is a protected area. Only logged-in users can see
                        this.
                    </p>

                    {/* Example: Displaying the token (for debugging/info) */}
                    {token && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                                Session Information
                            </h2>
                            <p className="text-sm text-gray-500">
                                Your access token:
                            </p>
                            <pre className="mt-1 p-3 bg-gray-100 text-xs text-gray-600 rounded-md overflow-x-auto shadow-inner">
                                {token}
                            </pre>
                        </div>
                    )}
                    {/* Add more dashboard-specific components and features here */}
                    {/* For example, a list of user's Kahoots, button to create new Kahoot, etc. */}
                </div>
            </div>
        </ProtectedRoute>
    );
}
