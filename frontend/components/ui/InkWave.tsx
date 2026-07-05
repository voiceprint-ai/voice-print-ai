"use client";

/**
 * InkWave — the recurring visual signature for Voiceprint AI.
 *
 * The shape IS the information, not decoration: a score near 0 draws a jagged,
 * erratic line (writing that doesn't sound like you); a score near 100 draws a
 * calm, confident stroke (writing that does). Deterministic function of score
 * only — no Math.random() — so it never flickers or mismatches on re-render.
 *
 * Always pair with the numeric score in text; this is illustrative, not the
 * only way the score is communicated (color/shape alone is never sufficient).
 *
 * @author Saamarth Attray
 */
interface InkWaveProps {
  /** 0-100. Lower = more jagged line, higher = calmer line. */
  score: number;
  width?: number;
  height?: number;
  className?: string;
  /** Accessible label; pass null if the score is already announced by adjacent text. */
  label?: string | null;
}

function buildPath(score: number, width: number, height: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  const jaggedness = 1 - clamped / 100; // 0 = calm, 1 = maximally jagged
  const midY = height / 2;
  const points = 28;
  const step = width / points;

  let d = `M 0 ${midY}`;
  for (let i = 1; i <= points; i += 1) {
    const x = i * step;
    // Smooth underlying wave (always present, subtle) + jitter that grows with jaggedness.
    const smooth = Math.sin(i * 0.9) * (height * 0.08);
    const jitter = Math.sin(i * 4.7 + i * i * 0.3) * (height * 0.32) * jaggedness;
    const y = midY + smooth + jitter;
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function InkWave({
  score,
  width = 320,
  height = 64,
  className,
  label = "Voice consistency",
}: InkWaveProps) {
  const path = buildPath(score, width, height);
  const strokeColor =
    score >= 70 ? "var(--color-moss-600)" : score >= 40 ? "var(--color-ochre-500)" : "var(--color-rose-600)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role={label ? "img" : "presentation"}
      aria-label={label ? `${label}: ${Math.round(score)} out of 100` : undefined}
      aria-hidden={label ? undefined : true}
    >
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}