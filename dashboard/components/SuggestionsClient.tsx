"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/Badge";

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

  const fetchSuggestions = useCallback(async (status: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        status === "all" ? "/api/suggestions" : `/api/suggestions?status=${status}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as { data: RuleSuggestion[] };
      setSuggestions(json.data);
    } catch {
      setError("Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSuggestions(filter);
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
      alert("Failed to update suggestion status.");
    } finally {
      setUpdating(null);
    }
  }

  const tabs: StatusFilter[] = ["pending", "adopted", "dismissed", "all"];

  return (
    <div className="space-y-4">
      {/* Tab filter */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              filter === tab
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          No {filter === "all" ? "" : filter} suggestions found.
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color={categoryColor[s.category] ?? "gray"}>{s.category}</Badge>
                  <Badge color={statusColor[s.status]}>{s.status}</Badge>
                  <span className="text-xs text-gray-600">{s.repoFullName}</span>
                  <span className="text-xs text-gray-700">
                    {s.occurrenceCount}x occurrence{s.occurrenceCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-xs text-gray-700 shrink-0">
                  {new Date(s.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-200">{s.patternDescription}</p>
                <pre className="mt-2 text-xs text-gray-400 bg-gray-950/80 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap border border-gray-800/60">
                  {s.suggestedRuleText}
                </pre>
              </div>

              {s.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => void updateStatus(s.id, "adopted")}
                    disabled={updating === s.id}
                    className="px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating === s.id ? "Saving..." : "Adopt"}
                  </button>
                  <button
                    onClick={() => void updateStatus(s.id, "dismissed")}
                    disabled={updating === s.id}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating === s.id ? "Saving..." : "Dismiss"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
