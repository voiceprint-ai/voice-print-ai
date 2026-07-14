"use client";

import { useState } from "react";
import { ApiError, generateProfile, type Project } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatusMessage } from "@/components/ui/Card";

export function ProfilePanel({
  project,
  onChange,
}: {
  project: Project;
  onChange: () => Promise<void>;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await generateProfile(project.id);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate a profile.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <h2 className="font-display font-semibold text-lg">Voice profile</h2>
        <Button onClick={() => void handleGenerate()} disabled={generating}>
          {generating
            ? "Generating…"
            : project.voiceProfile
              ? "Regenerate from samples"
              : "Generate profile"}
        </Button>
      </div>
      <StatusMessage message={error} tone="error" />

      {!project.voiceProfile ? (
        <p className="text-ink-500 text-sm">
          No profile yet. Add at least one sample above, then generate one.
        </p>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="sm:col-span-2">
            <dt className="font-medium">Summary</dt>
            <dd className="text-ink-700">{project.voiceProfile.summary}</dd>
          </div>
          <div>
            <dt className="font-medium">Tone</dt>
            <dd className="text-ink-700">{project.voiceProfile.tone}</dd>
          </div>
          <div>
            <dt className="font-medium">Sentence structure</dt>
            <dd className="text-ink-700">{project.voiceProfile.sentenceStructure}</dd>
          </div>
          <div>
            <dt className="font-medium">Vocabulary</dt>
            <dd className="text-ink-700">{project.voiceProfile.vocabulary}</dd>
          </div>
          <div>
            <dt className="font-medium">Quirks</dt>
            <dd className="text-ink-700">{project.voiceProfile.quirks.join(", ") || "—"}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
