
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
  return (
    <section className="global-container" aria-label="How Voiceprint works">
      <div className="row flex flex-col items-center gap-8">
        <h2 className="font-display font-bold text-2xl">How it works</h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-3xl">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-1 items-start rounded-2xl p-5 bg-ink-900 text-paper border-ink-900"
            >
              <span
                className="font-mono text-sm text-ochre-500"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display font-semibold text-lg">{step.title}</span>
              <p className="text-paper/80">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default Highlights;