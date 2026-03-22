"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, currentSession) => {
                setSession(currentSession);
                if (event === "INITIAL_SESSION") {
                    setIsLoading(false);
                }
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    const login = async (username: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: `${username}@kahootit.internal`,
            password,
        });
        if (error) throw new Error(error.message);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const token = session?.access_token ?? null;
    const isAuthenticated = !!session;

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, isLoading, login, logout }}>
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
