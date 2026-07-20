"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "@/lib/auth-context";

function AuthModal() {
  const { user, loading, isAuthModalOpen, setIsAuthModalOpen, signInWithGoogle, signOut } =
    useAuth();

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const close = () => setIsAuthModalOpen(false);

  const handleSignIn = async () => {
    await signInWithGoogle();
    close();
  };

  const handleSignOut = async () => {
    await signOut();
    close();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Account"
      onClick={close}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        className="relative w-full max-w-sm bg-paper rounded-2xl shadow-xl p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close account modal"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-ink-500 hover:bg-paper-dim hover:text-ink-900 transition-colors"
        >
          <FiX size={18} aria-hidden="true" />
        </button>

        {/* Title */}
        <h2 className="font-display font-bold text-xl text-ink-900 pr-8">
          {user ? "Your account" : "Sign in"}
        </h2>

        {user ? (
          /* Signed-in state */
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 bg-paper-dim rounded-xl px-4 py-3 break-all">
              <span className="text-xs font-display font-medium text-ink-500 uppercase tracking-wide">
                Signed in as
              </span>
              <span className="text-sm font-display font-semibold text-ink-900">
                {user.email ?? user.uid}
              </span>
            </div>
            <button
              onClick={() => void handleSignOut()}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-rose-100 text-rose-600 font-display font-semibold text-sm hover:bg-rose-600 hover:text-paper transition-colors"
            >
              <FiLogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        ) : (
          /* Signed-out state */
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-500 font-body leading-relaxed">
              Sign in to save your voice profile and compare new documents against it.
            </p>
            <button
              onClick={() => void handleSignIn()}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-ink-900/15 bg-paper hover:bg-paper-dim font-display font-semibold text-sm text-ink-900 transition-colors"
            >
              <FcGoogle size={20} aria-hidden="true" />
              Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
