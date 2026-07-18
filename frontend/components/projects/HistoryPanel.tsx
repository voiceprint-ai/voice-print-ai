"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ApiError, listAnalyses, type AnalysisRecord } from "@/lib/api";
import { Card, StatusMessage } from "@/components/ui/Card";

/** Format a Unix-ms timestamp as a short locale date string (e.g. "Jun 12"). */
function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Format for the full date shown on analysis cards (e.g. "Jun 12, 2025"). */
function fmtDateFull(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HistoryPanel({ projectId }: { projectId: string }) {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { analyses: data } = await listAnalyses(projectId);
        if (!cancelled) setAnalyses(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Couldn't load analysis history.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Data points for the chart — oldest first so the line flows left-to-right.
  const chartData = [...analyses]
    .reverse()
    .map((a) => ({ date: fmtDate(a.createdAt), score: Math.round(a.result.overallScore) }));

  return (
    <Card>
      <h2 className="font-display font-semibold text-lg mb-3">Consistency history</h2>

      {loading && <p className="text-ink-500 text-sm">Loading history…</p>}

      {!loading && error && <StatusMessage message={error} tone="error" />}

      {!loading && !error && analyses.length === 0 && (
        <p className="text-ink-500 text-sm">
          No analyses yet. Run a draft check above to see your history here.
        </p>
      )}

      {!loading && !error && analyses.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Line chart */}
          <div aria-hidden="true" style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece9e1" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b6e7a", fontFamily: "inherit" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#6b6e7a", fontFamily: "inherit" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#f6f4ef",
                    border: "1px solid rgba(32,34,43,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "inherit",
                  }}
                  formatter={(value) => [value, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3d4a8a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3d4a8a", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Screen-reader summary of the chart */}
          <p className="visually-hidden">
            Consistency scores over time:{" "}
            {chartData.map((p) => `${p.date}: ${p.score}`).join(", ")}.
          </p>

          {/* Per-analysis cards */}
          <ul className="flex flex-col gap-3">
            {analyses.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-ink-900/10 bg-paper-dim p-4 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm text-ink-500">{fmtDateFull(a.createdAt)}</span>
                  <span className="font-mono font-semibold text-sm">
                    {Math.round(a.result.overallScore)}
                    <span className="text-ink-500 font-normal">/100</span>
                  </span>
                </div>
                <p className="text-sm text-ink-700 line-clamp-2">{a.targetPreview}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
