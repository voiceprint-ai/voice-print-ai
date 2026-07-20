import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/global/Header";
import { SkipLink } from "@/components/global/SkipLink";
import { AuthProvider } from "@/lib/auth-context";
import AuthModal from "@/components/global/AuthModal";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Voiceprint AI",
  description: "Learn your writing voice, then check whether a new draft still sounds like you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col relative">
        <AuthProvider>
          <SkipLink />
          <Header />
          <AuthModal />
          <div id="main-content" className="flex-1">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}