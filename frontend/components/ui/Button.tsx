import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-paper",
  secondary: "bg-paper-dim hover:bg-ink-900/10 text-ink-900",
  danger: "bg-rose-100 hover:bg-rose-600 hover:text-paper text-rose-600",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * Shared button primitive. Min height 44px for touch-target size; disabled
 * state and focus ring come from globals.css so every button behaves the same.
 * @author Saamarth Attray
 */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-11 rounded-lg px-5 font-display font-semibold text-sm transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}