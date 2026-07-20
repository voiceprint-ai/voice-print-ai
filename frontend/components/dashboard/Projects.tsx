import Link from "next/link";
import ProjectsList from "./ProjectsList";
import IconArrowRight from "../icons/IconArrowRight";
import { StatusMessage } from "../ui/Card";
import type { Project } from "@/lib/api";
import ProjectsListLoading from "../loading/ProjectsListLoading";

type ProjectsProps = {
  projects: Project[] | null;
  error: string | null;
}

function Projects({ projects, error }: ProjectsProps) {
  return (
    <div aria-labelledby="recent-heading" className="relative">
      <div className="flex items-center justify-between mb-4">
      <h2
        id="recent-heading"
        className="font-display font-semibold text-2xl text-ink-900"
      >
        Recent projects
      </h2>
      <Link
        href="/projects"
        className="link__hover-effect flex items-center gap-1 text-sm font-medium text-ink-700"
      >
        View all
        <IconArrowRight />
      </Link>
    </div>

      {error && <StatusMessage message={error} tone="error" />}

      {projects === null && !error && (
        <ProjectsListLoading />
      )}

      {projects !== null && projects.length === 0 && (
        <p className="text-ink-500 text-sm">No projects yet.</p>
      )}

      {projects !== null && projects.length > 0 && (
        <ProjectsList projects={projects.slice(0, 6)} />
      )}
    </div>
  )
}

export default Projects
