"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/Badge";
import ErrorAlert from "@/components/ErrorAlert";

interface RuleSuggestion {
  id: number;
  repoFullName: string;
  category: string;
  patternDescription: string;
  suggestedRuleText: string;
  occurrenceCount: number;
  status: "pending" | "adopted" | "dismissed";
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "adopted" | "dismissed";

const statusColor: Record<string, "yellow" | "green" | "gray"> = {
  pending: "yellow",
  adopted: "green",
  dismissed: "gray",
};

const categoryColor: Record<string, "blue" | "purple" | "orange" | "green" | "gray"> = {
  accessibility: "blue",
  "type-safety": "purple",
  "bundle-size": "orange",
  convention: "green",
};

export default function SuggestionsClient() {
  const [suggestions, setSuggestions] = useState<RuleSuggestion[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchSuggestions = useCallback(async (status: StatusFilter, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        status === "all" ? "/api/suggestions" : `/api/suggestions?status=${status}`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as { data: RuleSuggestion[] };
      setSuggestions(json.data);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Failed to load suggestions.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSuggestions(filter, controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [filter, fetchSuggestions]);

  async function updateStatus(id: number, status: "adopted" | "dismissed") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    } catch {
      console.error("Failed to update suggestion status.");
    } finally {
      setUpdating(null);
    }
  }

  const tabs: StatusFilter[] = ["pending", "adopted", "dismissed", "all"];

  return (
    <div className="space-y-4">
      {/* Tab filter */}
      <div className="flex gap-1 p-1 rounded-lg w-fit border" style={{ background: "var(--surface-secondary)", borderColor: "var(--border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize"
            style={{
              background: filter === tab ? "var(--surface)" : "transparent",
              color: filter === tab ? "var(--accent)" : "var(--text-secondary)",
              boxShadow: filter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>
          No {filter === "all" ? "" : filter} suggestions found.
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl p-5 space-y-3 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color={categoryColor[s.category] ?? "gray"}>{s.category}</Badge>
                  <Badge color={statusColor[s.status]}>{s.status}</Badge>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.repoFullName}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {s.occurrenceCount}x occurrence{s.occurrenceCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(s.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.patternDescription}</p>
                <pre className="mt-2 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap border" style={{ color: "var(--text-secondary)", background: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                  {s.suggestedRuleText}
                </pre>
              </div>

              {s.status === "pending" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { updateStatus(s.id, "adopted").catch(() => undefined); }}
                    disabled={updating === s.id}
                    className="px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors disabled:opacity-50"
                    style={{ background: "#1A7F37" }}
                  >
                    {updating === s.id ? "Saving..." : "Adopt"}
                  </button>
                  <button
                    onClick={() => { updateStatus(s.id, "dismissed").catch(() => undefined); }}
                    disabled={updating === s.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50 border"
                    style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)", borderColor: "var(--border)" }}
                  >
                    {updating === s.id ? "Saving..." : "Dismiss"}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
