import Link from "next/link";
import { Card } from "../ui/Card";
import { Project } from "@/lib/api";

type ProjectListsProps = {
  projects: Project[]
}

function ProjectsList({ projects }: ProjectListsProps) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="block rounded-2xl h-full group "
          >
            <Card className="flex flex-col gap-3 h-full bg-ink-900 group-hover:opacity-95 border-4 transition-opacity">
              <div className="flex items-start justify-between gap-2 ">
                <h3 className="font-display font-semibold text-xl text-paper leading-snug">
                  {project.name}
                </h3>
                <span
                  className={`shrink-0 text-sm font-medium px-2 py-0.5 rounded-full shadow-md ${
                    project.voiceProfile
                      ? "bg-moss-300 text-moss-600"
                      : "bg-paper-dim text-ink-500"
                  }`}
                >
                  {project.voiceProfile ? "Profile ready" : "No profile"}
                </span>
              </div>
              <p className="text-sm text-ochre-300 mt-auto">
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