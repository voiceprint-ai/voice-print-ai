import { Card } from "../ui/Card";

function ProjectsListLoading() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <li>
        <Card className="flex flex-col gap-3 h-full bg-ink-900 border-4 animate-pulse">
          <div className="flex items-start justify-between gap-2">
            <div className="h-6 w-2/3 rounded-md bg-ink-700" />
            <div className="h-5 w-20 shrink-0 rounded-full bg-ink-700" />
          </div>
          <div className="h-4 w-16 rounded-md bg-ink-700 mt-auto" />
        </Card>
      </li>
    </ul>
  );
}

export default ProjectsListLoading;
