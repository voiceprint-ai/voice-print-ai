"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { FcGoogle } from "react-icons/fc";

export function SignInPrompt() {
  const { signInWithGoogle } = useAuth();

  return (
    <main className="global-container">
      <div className="row flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">

          {/* Logo mark */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Voiceprint<span className="text-indigo-600">.</span>
            </span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-ink-900">
              Sign in to continue
            </h1>
            <p className="text-ink-500 text-sm md:text-base leading-relaxed">
              Your projects and writing samples are private to your account.
            </p>
          </div>

          {/* Sign-in button */}
          <Button
            variant="secondary"
            onClick={() => void signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 border border-ink-900/15"
          >
            <FcGoogle size={22} />
            Continue with Google
          </Button>

          <p className="text-xs text-ink-500">
            By signing in you agree to our terms of service.
          </p>
        </div>
      </div>
    </main>
  );
}
