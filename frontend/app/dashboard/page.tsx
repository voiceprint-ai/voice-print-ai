import Link from "next/link";
import Features from "@/components/home/Features";
import Highlights from "@/components/home/Highlights";
import { InkWave } from "@/components/ui/InkWave";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <section className="global_container">
        <div className="row flex flex-col items-center text-center gap-6 py-12 md:py-20">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-3xl text-balance">
            Sound like <span className="text-indigo-600">yourself.</span>
          </h1>
          <p className="text-ink-700 text-lg md:text-xl max-w-xl">
            Voiceprint learns how you write, then tells you when a new draft
            drifts from your own voice — and rewrites it back.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 w-full max-w-xl justify-center">
            <div className="flex flex-col items-center gap-2">
              <InkWave score={22} width={220} height={56} label="Generic AI draft" />
              <span className="text-sm text-ink-500 font-mono">generic draft</span>
            </div>
            <span className="text-ink-500 font-display" aria-hidden="true">
              &rarr;
            </span>
            <div className="flex flex-col items-center gap-2">
              <InkWave score={92} width={220} height={56} label="Written in your voice" />
              <span className="text-sm text-ink-500 font-mono">in your voice</span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-paper font-display font-semibold py-3 px-10 rounded-lg text-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </section>

      <Features />
      <Highlights />
    </main>
  );
}