"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createProject, listProjects, type Project } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatusMessage } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useRouter } from "next/navigation";

function ProjectsContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { projects: list } = await listProjects();
        if (!cancelled) setProjects(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load your projects.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function refresh() {
    try {
      const { projects: list } = await listProjects();
      setProjects(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your projects.");
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const { project } = await createProject(name.trim());
      setName("");
      await refresh();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the project.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="global-container">
      <div className="row flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display font-bold text-3xl">Your projects</h1>
          <p className="text-ink-700">
            Each project holds one voice — its reference samples, its profile, and every
            draft you&apos;ve checked against it.
          </p>
        </div>

        <section aria-labelledby="new-project-heading">
          <Card>
            <h2 id="new-project-heading" className="font-display font-semibold text-lg mb-3">
              Start a new project
            </h2>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 w-full">
                <TextField
                  label="Project name"
                  placeholder="e.g. Blog voice, Grad school essays"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
              <Button type="submit" disabled={creating || !name.trim()} className="sm:mt-6">
                {creating ? "Creating…" : "Create project"}
              </Button>
            </form>
            <StatusMessage message={error} tone="error" />
          </Card>
        </section>

        <section aria-label="Existing projects">
          {projects === null && !error && <p className="text-ink-500">Loading projects…</p>}

          {projects !== null && projects.length === 0 && (
            <Card className="text-center py-10">
              <p className="text-ink-700">
                No projects yet. Create one above to start building a voice profile.
              </p>
            </Card>
          )}

          {projects !== null && projects.length > 0 && (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="block rounded-2xl">
                    <Card className="hover:border-indigo-600 transition-colors h-full">
                      <h3 className="font-display font-semibold text-lg">{p.name}</h3>
                      <p className="text-sm text-ink-500 mt-1">
                        {p.sampleCount} sample{p.sampleCount === 1 ? "" : "s"} &middot;{" "}
                        {p.voiceProfile ? "profile ready" : "no profile yet"}
                      </p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <RequireAuth>
      <ProjectsContent />
    </RequireAuth>
  );
}
