"use client";

import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardStatistics from "@/components/dashboard/DashboardStatistics";
import { RequireAuth } from "@/components/global/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <main className="global-container">
        <div className="row flex flex-col gap-10 py-6 md:py-10">
          <DashboardHero />
          <DashboardStatistics />
        </div>
      </main>
    </RequireAuth>
  );
}
