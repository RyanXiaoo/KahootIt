"use client";

import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

interface MainContentWrapperProps {
    children: ReactNode;
}

export default function MainContentWrapper({
    children,
}: MainContentWrapperProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const pathname = usePathname();

    // Determine if the navbar would be visible
    // The navbar is NOT visible on host and play pages
    const isNavbarHidden = pathname?.startsWith('/host/') || pathname?.startsWith('/play/');
    const isNavbarVisible = !isLoading && isAuthenticated && !isNavbarHidden;

    return <main className={isNavbarVisible ? "pt-16" : ""}>{children}</main>;
}
