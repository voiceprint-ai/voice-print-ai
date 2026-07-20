"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  deleteProject,
  getProject,
  listSamples,
  type Project,
  type Sample,
} from "@/lib/api";
import { StatusMessage } from "@/components/ui/Card";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { SamplesPanel } from "@/components/projects/SamplesPanel";
import { ProfilePanel } from "@/components/projects/ProfilePanel";
import { AnalyzePanel } from "@/components/projects/AnalyzePanel";
import { RewritePanel } from "@/components/projects/RewritePanel";
import LoadingCircles from "@/components/animation/LoadingCircles";

function ProjectDetailContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { user } = useAuth();

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

  if (loadError) {
    return (
      <main className="global-container">
        <div className="row">
          <StatusMessage message={loadError} tone="error" />
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="global-container">
        <div className="row min-h-[70vh] flex justify-center items-center relative">
          <div className="flex flex-col justify-between items-center gap-5 text-ink-500 text-lg absolute top-8 left-1/2 -translate-x-1/2">
            <span>Loading your project</span> 
            <LoadingCircles />
          </div>
        </div>
      </main>
    );
  }

  async function handleDeleteProject() {
    if (!confirm(`Delete "${project!.name}" and everything in it? This can't be undone.`)) return;
    await deleteProject(project!.id);
    router.push("/projects");
  }

  return (
    <main className="global-container">
      <div className="row flex flex-col gap-8">
        <ProjectHeader
          project={project}
          samples={samples}
          onDelete={() => void handleDeleteProject()}
        />
        <SamplesPanel projectId={project.id} samples={samples} onChange={refresh} />
        <ProfilePanel project={project} onChange={refresh} />
        <AnalyzePanel projectId={project.id} hasProfile={Boolean(project.voiceProfile)} />
        <RewritePanel projectId={project.id} hasProfile={Boolean(project.voiceProfile)} />
      </div>
    </main>
  );
}

export default function ProjectDetailPage() {
  return (
    <RequireAuth>
      <ProjectDetailContent />
    </RequireAuth>
  );
}
