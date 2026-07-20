import { Button } from "../ui/Button";
import IconPlus from "../icons/IconPlus";
import Link from "next/link";

function DashboardHero() {
    return (
        <section className="flex flex-col gap-2">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-ink-900">
                    Dashboard
                </h1>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-6">
                <p className="text-ink-500 text-md md:text-lg">
                    Manage your voice profiles, writing samples, and AI-assisted drafts all in one creative workspace.
                </p>
                <Link href="/projects">
                    <Button variant="primary" className="flex items-center gap-2 w-fit text-nowrap md:-translate-y-2">
                        <IconPlus />
                        New project
                    </Button>
                </Link>
            </div>
        </section>
    )
}

export default DashboardHero