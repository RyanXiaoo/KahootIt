"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext"; // Adjust path as necessary

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/"); // Redirect to login page if not authenticated and not loading
        }
    }, [isLoading, isAuthenticated, router]);

    // While loading, or if not authenticated (and redirect is in progress),
    // show a loading indicator or return null to prevent rendering children prematurely.
    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                {" "}
                {/* Adjust min-height if navbar height differs */}
                <p className="text-gray-700 text-lg">Loading...</p>
                {/* You can replace this with a spinner or a more sophisticated skeleton loader */}
            </div>
        );
    }

    // If authenticated and not loading, render the children (the protected page content)
    return <>{children}</>;
};

export default ProtectedRoute;
