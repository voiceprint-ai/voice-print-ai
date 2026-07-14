"use client";

import { useState, type FormEvent } from "react";
import { ApiError, analyzeTarget, type AnalysisResult } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatusMessage } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { InkWave } from "@/components/ui/InkWave";

export function AnalyzePanel({
  projectId,
  hasProfile,
}: {
  projectId: string;
  hasProfile: boolean;
}) {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    if (!target.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const { result: r } = await analyzeTarget(projectId, target);
      setResult(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't analyze that draft.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display font-semibold text-lg mb-3">Check a draft</h2>
      {!hasProfile ? (
        <p className="text-ink-500 text-sm">Generate a voice profile above before analyzing a draft.</p>
      ) : (
        <>
          <form onSubmit={handleAnalyze} className="flex flex-col gap-3 mb-5">
            <TextArea
              label="Draft to check"
              placeholder="Paste a draft to score against your voice profile…"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
            <Button type="submit" disabled={running || !target.trim()} className="w-fit">
              {running ? "Analyzing…" : "Analyze"}
            </Button>
            <StatusMessage message={error} tone="error" />
          </form>

          {result && (
            <div className="flex flex-col gap-4 border-t border-ink-900/10 pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <InkWave score={result.overallScore} width={200} height={48} label={null} />
                <span className="font-mono text-2xl font-semibold" aria-hidden="true">
                  {Math.round(result.overallScore)}
                  <span className="text-ink-500 text-base">/100</span>
                </span>
                <span className="visually-hidden">
                  Overall consistency score: {Math.round(result.overallScore)} out of 100
                </span>
              </div>
              <p className="text-ink-700">{result.summary}</p>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {Object.entries(result.dimensions).map(([key, value]) => (
                  <div key={key}>
                    <dt className="capitalize text-ink-500">{key.replace(/([A-Z])/g, " $1")}</dt>
                    <dd className="font-mono font-semibold">{Math.round(value)}</dd>
                  </div>
                ))}
              </dl>
              {result.driftNotes.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Where it drifts</p>
                  <ul className="list-disc list-inside text-sm text-ink-700 flex flex-col gap-1">
                    {result.driftNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
