import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
}

/**
 * Every field gets a real <label>, not a placeholder standing in for one —
 * placeholders disappear on input and fail for screen readers. Errors are
 * linked via aria-describedby so assistive tech announces them.
 * @author Saamarth Attray
 */
export function TextField({
  label,
  hint,
  error,
  id,
  ...props
}: FieldWrapperProps & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={fieldId} className="font-display text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className="w-full rounded-lg border border-ink-900/20 bg-paper px-3 py-2.5 min-h-11 text-ink-900 placeholder:text-ink-500"
        {...props}
      />
      {hint && (
        <span id={hintId} className="text-xs text-ink-500">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  error,
  id,
  ...props
}: FieldWrapperProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={fieldId} className="font-display text-sm font-medium">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className="w-full rounded-lg border border-ink-900/20 bg-paper px-3 py-2.5 min-h-32 text-ink-900 placeholder:text-ink-500 font-body"
        {...props}
      />
      {hint && (
        <span id={hintId} className="text-xs text-ink-500">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}