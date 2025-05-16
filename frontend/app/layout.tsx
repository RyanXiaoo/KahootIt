import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Keep or remove based on your font choice
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar"; // Import the new Navbar
import MainContentWrapper from "../components/MainContentWrapper"; // Import the new wrapper

// const inter = Inter({ subsets: ["latin"] }); // Keep or remove

export const metadata: Metadata = {
    title: "KahootIt!",
    description: "Generate Kahoots from your notes!",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            {/* <body className={inter.className}> // Apply font class if needed */}
            <body className="bg-gray-50">
                <AuthProvider>
                    <Navbar /> {/* Navbar is placed here */}
                    <MainContentWrapper>
                        {" "}
                        {/* MainContentWrapper now handles the <main> tag and conditional padding */}
                        {/* Main content area: Apply padding-top to prevent overlap with sticky navbar */}
                        {/* The pt-16 assumes navbar height of approx 4rem (64px). Adjust if needed. */}
                        {children}
                    </MainContentWrapper>
                </AuthProvider>
            </body>
        </html>
    );
}
