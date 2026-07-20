"use client";

import { useAuth } from "@/lib/auth-context";
import { SignInPrompt } from "./SignInPrompt";
import RotatingDiamonds from "../animation/RotatingDiamonds";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="global-container">
        <div className="row flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 relative">
            <RotatingDiamonds
              smallScreenDiamondSize={240}
              mediumScreenDiamondSize={240}
              largeScreenDiamondSize={386} />
            {/* Pulsing logo mark */}
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </div>
            <p className="text-ink-500 text-base font-display">
              Loading your account…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return <SignInPrompt />;
  }

  return <>{children}</>;
}
