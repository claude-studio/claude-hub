"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import StatCard from "@/components/StatCard";
import ChartCard from "@/components/ChartCard";
import ErrorAlert from "@/components/ErrorAlert";

interface AnalyticsData {
  totalReviews: number;
  totalComments: number;
  categoryStats: { category: string; count: number }[];
  severityStats: { severity: string; count: number }[];
  decisionStats: { decision: string; count: number }[];
  weeklyTrend: { week: string; count: number }[];
  dailyTrend: { day: string; count: number }[];
  topRepos: { repoFullName: string; reviewCount: number }[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  unknown: "#6b7280",
};

const DECISION_COLORS: Record<string, string> = {
  approved: "#22c55e",
  request_changes: "#ef4444",
  commented: "#3b82f6",
  unknown: "#6b7280",
};

const CATEGORY_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/analytics", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json() as AnalyticsData;
        setData(json);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Failed to load analytics data.");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error !== null || !data) {
    return <ErrorAlert message={error ?? "No data available."} />;
  }

  const avgComments =
    data.totalReviews > 0
      ? (data.totalComments / data.totalReviews).toFixed(1)
      : "0";

  const approvalRate =
    data.decisionStats.length > 0
      ? (
          ((data.decisionStats.find((d) => d.decision === "approved")?.count ?? 0) /
            data.totalReviews) *
          100
        ).toFixed(0) + "%"
      : "—";

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Reviews" value={data.totalReviews} />
        <StatCard label="Total Comments" value={data.totalComments} />
        <StatCard label="Avg Comments/Review" value={avgComments} />
        <StatCard label="Approval Rate" value={approvalRate} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily trend */}
        <ChartCard title="Daily Reviews (last 30 days)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "#AEAEB2", fontSize: 11 }}
                tickFormatter={(v: string) =>
                  new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fill: "#AEAEB2", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelStyle={{ color: "#6E6E73" }}
                itemStyle={{ color: "#0071E3" }}
                labelFormatter={(v) =>
                  new Date(String(v)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0071E3"
                strokeWidth={2}
                dot={false}
                name="Reviews"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Severity distribution */}
        <ChartCard title="Severity Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.severityStats}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.severityStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SEVERITY_COLORS[entry.severity] ?? "#AEAEB2"}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: "#6E6E73", fontSize: 12 }}>{value}</span>
                )}
              />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                itemStyle={{ color: "#1C1C1E" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category breakdown */}
        <ChartCard title="Comments by Category">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.categoryStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#AEAEB2", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fill: "#6E6E73", fontSize: 11 }}
                width={90}
              />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                itemStyle={{ color: "#1C1C1E" }}
              />
              <Bar dataKey="count" name="Comments" radius={[0, 4, 4, 0]}>
                {data.categoryStats.map((_, index) => (
                  <Cell
                    key={`cat-${index}`}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Decision distribution */}
        <ChartCard title="Review Decisions">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.decisionStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="decision"
                tick={{ fill: "#6E6E73", fontSize: 11 }}
                tickFormatter={(v: string) => v.replace("_", " ")}
              />
              <YAxis tick={{ fill: "#AEAEB2", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                itemStyle={{ color: "#1C1C1E" }}
                formatter={(value) => [value, "Reviews"]}
                labelFormatter={(v) => String(v).replace("_", " ")}
              />
              <Bar dataKey="count" name="Reviews" radius={[4, 4, 0, 0]}>
                {data.decisionStats.map((entry, index) => (
                  <Cell
                    key={`dec-${index}`}
                    fill={DECISION_COLORS[entry.decision] ?? "#AEAEB2"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top repos table */}
      {data.topRepos.length > 0 ? (
        <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Top Repositories</h3>
          <div className="space-y-2">
            {(() => {
              const max = data.topRepos[0]?.reviewCount ?? 1;
              return data.topRepos.map((repo, i) => {
                const pct = (repo.reviewCount / max) * 100;
                return (
                  <div key={repo.repoFullName} className="flex items-center gap-3">
                    <span className="text-xs w-4 text-right" style={{ color: "var(--text-tertiary)" }}>{i + 1}</span>
                    <span className="text-sm w-48 truncate" style={{ color: "var(--text-secondary)" }}>{repo.repoFullName}</span>
                    <div className="flex-1 rounded-full h-2" style={{ background: "var(--surface-secondary)" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "var(--accent)" }}
                      />
                    </div>
                    <span className="text-xs w-16 text-right" style={{ color: "var(--text-tertiary)" }}>
                      {repo.reviewCount} review{repo.reviewCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
