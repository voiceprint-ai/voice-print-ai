"use client";

import { useState, type FormEvent } from "react";
import { ApiError, addSample, deleteSample, type Sample } from "@/lib/api";
import { extractTextFromFile, UnsupportedFileError } from "@/lib/extractText";
import { Button } from "@/components/ui/Button";
import { Card, StatusMessage } from "@/components/ui/Card";
import { TextArea, TextField } from "@/components/ui/Field";

export function SamplesPanel({
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
    e.target.value = "";
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
