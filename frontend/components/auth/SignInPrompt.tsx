"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

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
            <IconGoogle />
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
