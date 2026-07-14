"use client";

import { useState, type FormEvent } from "react";
import { ApiError, rewriteTarget, type RewriteResult } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatusMessage } from "@/components/ui/Card";
import { TextArea, TextField } from "@/components/ui/Field";

export function RewritePanel({
  projectId,
  hasProfile,
}: {
  projectId: string;
  hasProfile: boolean;
}) {
  const [target, setTarget] = useState("");
  const [instructions, setInstructions] = useState("");
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRewrite(e: FormEvent) {
    e.preventDefault();
    if (!target.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const { result: r } = await rewriteTarget(projectId, target, instructions.trim() || undefined);
      setResult(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't rewrite that draft.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display font-semibold text-lg mb-3">Rewrite toward your voice</h2>
      {!hasProfile ? (
        <p className="text-ink-500 text-sm">Generate a voice profile above before rewriting a draft.</p>
      ) : (
        <>
          <form onSubmit={handleRewrite} className="flex flex-col gap-3 mb-5">
            <TextArea
              label="Draft to rewrite"
              placeholder="Paste the draft you want rewritten…"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
            <TextField
              label="Extra instructions (optional)"
              placeholder="e.g. Make it punchier, keep it under 100 words"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={500}
            />
            <Button type="submit" disabled={running || !target.trim()} className="w-fit">
              {running ? "Rewriting…" : "Rewrite"}
            </Button>
            <StatusMessage message={error} tone="error" />
          </form>

          {result && (
            <div className="flex flex-col gap-3 border-t border-ink-900/10 pt-4">
              <p className="font-medium text-sm">Rewritten draft</p>
              <p className="font-body whitespace-pre-wrap text-ink-900 bg-paper-dim rounded-lg p-4">
                {result.rewritten}
              </p>
              {result.changeNotes.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">What changed</p>
                  <ul className="list-disc list-inside text-sm text-ink-700 flex flex-col gap-1">
                    {result.changeNotes.map((note, i) => (
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
