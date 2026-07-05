"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "Upload your writing",
    body: "Add past samples or paste a new draft.",
  },
  {
    title: "Analyze your style",
    body: "Voiceprint studies tone, structure, vocabulary, and flow.",
  },
  {
    title: "Review your score",
    body: "See where your writing matches your voice, and where it shifts.",
  },
  {
    title: "Write with confidence",
    body: "Generate a rewrite that stays closer to your own style.",
  },
];

function Highlights() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return; // Static first step for anyone who's asked for less motion.

    const intervalId = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="global_container" aria-label="How Voiceprint works">
      <div className="row flex flex-col items-center gap-8">
        <h2 className="font-display font-bold text-2xl">How it works</h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={`flex flex-col gap-1 items-start rounded-2xl p-5 border transition-colors duration-300 ${
                active === i
                  ? "bg-ink-900 text-paper border-ink-900"
                  : "bg-transparent text-ink-900 border-ink-900/15"
              }`}
            >
              <span
                className={`font-mono text-sm ${active === i ? "text-ochre-500" : "text-ink-500"}`}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display font-semibold text-lg">{step.title}</span>
              <p className={active === i ? "text-paper/80" : "text-ink-700"}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default Highlights;