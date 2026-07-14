"use client";
import { Card, StatusMessage } from "@/components/ui/Card";
import IconFolder from "@/components/icons/IconFolder";
import IconMic from "@/components/icons/IconMic";
import IconFileAudio from "@/components/icons/IconFileAudio";
import IconSearch from "@/components/icons/IconSearch";
import { useEffect, useState } from "react";
import { ApiError, listProjects, Project } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Projects from "./Projects";

function DashboardStatistics() {
    const [projects, setProjects] = useState<Project[] | null>(null);
    const { user}  = useAuth()
    const [error, setError] = useState<string | null>(null);

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

    const totalProjects = projects?.length ?? "--";
    const totalSamples = projects?.reduce((sum, project) => sum + project.sampleCount, 0) ?? "--";
    const totalVoiceProfilesReady = projects?.filter((project) => project.voiceProfile).length ?? "--";
    const totalVoiceProfilesPending = projects?.filter((project) => !project.voiceProfile).length ?? '--';


    const STATS = [
        {
            label: "Total projects",
            value: totalProjects, 
            Icon: IconFolder,
            color: "text-indigo-600",
            bg: "bg-indigo-600/8",
        },
        {
            label: "Sample uploaded",
            value: totalSamples,
            Icon: IconFileAudio,
            color: "text-ochre-500",
            bg: "bg-ochre-100",
        },
        {
            label: "Voice profiles ready",
            value: totalVoiceProfilesReady,
            Icon: IconMic,
            color: "text-moss-600",
            bg: "bg-moss-100",
        },
        {
            label: "Profiles pending",
            value: totalVoiceProfilesPending,
            Icon: IconSearch,
            color: "text-rose-600",
            bg: "bg-rose-100",
        },
    ];

    return (
        <section 
            aria-labelledby="stats-heading"
            className="flex flex-col justify-between gap-10">
            <h2 id="stats-heading" className="visually-hidden">
                Summary statistics
            </h2>
            {error && <StatusMessage message={error} tone="error" />}
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(({ label, value, Icon, color, bg }) => (
                    <li key={label}>
                        <Card className="flex flex-col gap-3 h-full">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                                <Icon className={color} />
                            </div>
                            <div>
                                <p className="font-display font-bold text-2xl md:text-3xl text-ink-900">
                                    {value}
                                </p>
                                <p className="text-ink-500 text-sm leading-snug mt-0.5">{label}</p>
                            </div>
                        </Card>
                    </li>
                ))}
            </ul>

            <Projects
                projects={projects}
                error={error} />
        </section>
    )
}

export default DashboardStatistics