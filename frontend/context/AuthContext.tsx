"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (accessToken: string) => void;
    logout: () => void;
    // You could add user object here later: user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true to check localStorage
    const router = useRouter();

    useEffect(() => {
        // Check for token in localStorage on initial load
        try {
            const storedToken = localStorage.getItem("accessToken");
            if (storedToken) {
                setToken(storedToken);
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
            // Handle environments where localStorage is not available or restricted
        }
        setIsLoading(false);
    }, []);

    const login = (accessToken: string) => {
        try {
            localStorage.setItem("accessToken", accessToken);
            setToken(accessToken);
            // router.push('/dashboard'); // Or let the calling component handle navigation
        } catch (error) {
            console.error("Could not access localStorage:", error);
        }
    };

    const logout = () => {
        try {
            localStorage.removeItem("accessToken");
            setToken(null);
            router.push("/"); // Redirect to login page on logout
        } catch (error) {
            console.error("Could not access localStorage:", error);
        }
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider
            value={{ token, isAuthenticated, isLoading, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
