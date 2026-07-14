"use client";

import { Button } from "@/components/ui/Button";
import type { Project } from "@/lib/api";
import type { Sample } from "@/lib/api";

export function ProjectHeader({
  project,
  samples,
  onDelete,
}: {
  project: Project;
  samples: Sample[];
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-display font-bold text-3xl">{project.name}</h1>
        <p className="text-ink-500 text-sm mt-1">
          {samples.length} sample{samples.length === 1 ? "" : "s"} &middot;{" "}
          {project.voiceProfile ? "profile ready" : "no profile yet"}
        </p>
      </div>
      <Button variant="danger" onClick={onDelete}>
        Delete project
      </Button>
    </div>
  );
}
