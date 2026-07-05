import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ink-900/10 bg-paper p-5 md:p-6 ${className}`}
      {...props}
    />
  );
}

interface StatusMessageProps {
  /** null/undefined renders nothing. */
  message?: string | null;
  tone?: "neutral" | "error" | "success";
}

const TONE_CLASSES: Record<NonNullable<StatusMessageProps["tone"]>, string> = {
  neutral: "text-ink-700",
  error: "text-rose-600",
  success: "text-moss-600",
};

/**
 * aria-live region for async status ("Saving…", "Created.", error text). Screen
 * readers announce changes here without the user needing to find and re-read
 * anything — important since these panels update after button clicks with no
 * page navigation.
 * @author Saamarth Attray
 */
export function StatusMessage({ message, tone = "neutral" }: StatusMessageProps) {
  if (!message) return null;
  return (
    <p role="status" aria-live="polite" className={`text-sm ${TONE_CLASSES[tone]}`}>
      {message}
    </p>
  );
}