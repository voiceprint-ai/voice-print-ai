"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  analyzeTarget,
  addSample,
  deleteProject,
  deleteSample,
  generateProfile,
  getProject,
  listSamples,
  rewriteTarget,
  type AnalysisResult,
  type Project,
  type RewriteResult,
  type Sample,
} from "@/lib/api";
import { extractTextFromFile, UnsupportedFileError } from "@/lib/extractText";
import { Button } from "@/components/ui/Button";
import { Card, StatusMessage } from "@/components/ui/Card";
import { TextArea, TextField } from "@/components/ui/Field";
import { InkWave } from "@/components/ui/InkWave";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Imperative re-fetch, called from child panels after a mutation (add sample,
  // generate profile, etc.) — an event-handler context, not an effect.
  const refresh = useCallback(async () => {
    try {
      const [{ project: p }, { samples: s }] = await Promise.all([
        getProject(projectId),
        listSamples(projectId),
      ]);
      setProject(p);
      setSamples(s);
    } catch (err) {
      setLoadError(
        err instanceof ApiError && err.status === 404
          ? "This project doesn't exist, or isn't yours."
          : "Couldn't load this project.",
      );
    }
  }, [projectId]);

  // Initial load on mount, written as the async-IIFE-inside-effect pattern React
  // recommends, so state updates only apply if the component is still mounted.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ project: p }, { samples: s }] = await Promise.all([
          getProject(projectId),
          listSamples(projectId),
        ]);
        if (!cancelled) {
          setProject(p);
          setSamples(s);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError && err.status === 404
              ? "This project doesn't exist, or isn't yours."
              : "Couldn't load this project.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, projectId]);

  if (authLoading) {
    return (
      <main className="global_container">
        <div className="row">
          <p className="text-ink-500">Loading your account…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="global_container">
        <div className="row flex flex-col items-start gap-4 max-w-lg">
          <h1 className="font-display font-bold text-2xl">Sign in to continue</h1>
          <Button onClick={() => void signInWithGoogle()}>Sign in with Google</Button>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="global_container">
        <div className="row">
          <StatusMessage message={loadError} tone="error" />
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="global_container">
        <div className="row">
          <p className="text-ink-500">Loading project…</p>
        </div>
      </main>
    );
  }

  async function handleDeleteProject() {
    if (!confirm(`Delete "${project!.name}" and everything in it? This can't be undone.`)) return;
    await deleteProject(project!.id);
    router.push("/dashboard");
  }

  return (
    <main className="global_container">
      <div className="row flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-3xl">{project.name}</h1>
            <p className="text-ink-500 text-sm mt-1">
              {samples.length} sample{samples.length === 1 ? "" : "s"} &middot;{" "}
              {project.voiceProfile ? "profile ready" : "no profile yet"}
            </p>
          </div>
          <Button variant="danger" onClick={() => void handleDeleteProject()}>
            Delete project
          </Button>
        </div>

        <SamplesPanel projectId={project.id} samples={samples} onChange={refresh} />
        <ProfilePanel project={project} onChange={refresh} />
        <AnalyzePanel projectId={project.id} hasProfile={Boolean(project.voiceProfile)} />
        <RewritePanel projectId={project.id} hasProfile={Boolean(project.voiceProfile)} />
      </div>
    </main>
  );
}

// --- Samples ---

function SamplesPanel({
  projectId,
  samples,
  onChange,
}: {
  projectId: string;
  samples: Sample[];
  onChange: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setExtracting(true);
    setError(null);
    setStatus(null);
    try {
      const extracted = await extractTextFromFile(file);
      setText(extracted);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.(txt|docx|pdf)$/i, ""));
      }
      setStatus(`Extracted ${extracted.length.toLocaleString()} characters from ${file.name}.`);
    } catch (err) {
      setError(
        err instanceof UnsupportedFileError ? err.message : "Couldn't read that file.",
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addSample(projectId, title.trim(), text);
      setTitle("");
      setText("");
      setStatus("Sample added.");
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that sample.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sampleId: string) {
    try {
      await deleteSample(projectId, sampleId);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that sample.");
    }
  }

  return (
    <Card aria-label="Reference samples">
      <h2 className="font-display font-semibold text-lg mb-3">Reference samples</h2>
      <p className="text-ink-700 text-sm mb-4">
        Add past writing that represents your voice. More samples build a sharper profile.
      </p>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-5">
        <TextField
          label="Title"
          placeholder="e.g. Blog post draft"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sample-file" className="font-display text-sm font-medium">
            Upload a file (optional)
          </label>
          <input
            id="sample-file"
            type="file"
            accept=".txt,.docx,.pdf"
            onChange={(e) => void handleFileChange(e)}
            disabled={extracting}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-paper-dim file:px-3 file:py-2 file:font-display file:font-medium file:cursor-pointer"
          />
          <span className="text-xs text-ink-500">
            .txt, .docx, or .pdf — extracted text fills the box below, or paste text directly.
          </span>
          {extracting && (
            <span role="status" aria-live="polite" className="text-xs text-indigo-600">
              Reading file…
            </span>
          )}
        </div>

        <TextArea
          label="Text"
          placeholder="Paste the writing sample here, or upload a file above…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <Button type="submit" disabled={saving || !title.trim() || !text.trim()} className="w-fit">
          {saving ? "Adding…" : "Add sample"}
        </Button>
        <StatusMessage message={status} tone="success" />
        <StatusMessage message={error} tone="error" />
      </form>

      {samples.length === 0 ? (
        <p className="text-ink-500 text-sm">No samples yet — add your first one above.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {samples.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 border border-ink-900/10 rounded-lg px-3 py-2"
            >
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-ink-500 font-mono">{s.charCount} characters</p>
              </div>
              <Button variant="danger" onClick={() => void handleDelete(s.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// --- Voice profile ---

function ProfilePanel({
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

// --- Analyze ---

function AnalyzePanel({ projectId, hasProfile }: { projectId: string; hasProfile: boolean }) {
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

// --- Rewrite ---

function RewritePanel({ projectId, hasProfile }: { projectId: string; hasProfile: boolean }) {
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