"use client";

import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext"; // Adjust path as necessary

interface MainContentWrapperProps {
    children: ReactNode;
}

export default function MainContentWrapper({
    children,
}: MainContentWrapperProps) {
    const { isAuthenticated, isLoading } = useAuth();

    // Determine if the navbar would be visible
    // The navbar is visible if not loading and authenticated.
    const isNavbarVisible = !isLoading && isAuthenticated;

    return <main className={isNavbarVisible ? "pt-16" : ""}>{children}</main>;
}
