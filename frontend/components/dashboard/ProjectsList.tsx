import Link from "next/link";
import { Card } from "../ui/Card";
import { Project } from "@/lib/api";


type ProjectListsProps = {
  recentProjects: Project[]
}

function ProjectsList({ recentProjects }: ProjectListsProps) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {recentProjects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="block rounded-2xl h-full group"
          >
            <Card className="flex flex-col gap-3 h-full group-hover:border-indigo-600 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-semibold text-base text-ink-900 leading-snug">
                  {project.name}
                </h3>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    project.voiceProfile
                      ? "bg-moss-100 text-moss-600"
                      : "bg-paper-dim text-ink-500"
                  }`}
                >
                  {project.voiceProfile ? "Profile ready" : "No profile"}
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-auto">
                {project.sampleCount} sample{project.sampleCount === 1 ? "" : "s"}
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default ProjectsList