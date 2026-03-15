import Badge from "@/components/Badge";

interface ReviewRow {
  id: number;
  prNumber: number;
  repoFullName: string;
  commitSha: string;
  decision: "approved" | "request_changes" | "commented" | null;
  summary: string | null;
  processingMs: number | null;
  createdAt: string;
  commentCount: number;
}

async function fetchReviews(): Promise<{ data: ReviewRow[]; total: number }> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/reviews?limit=50`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

const decisionBadge: Record<string, "green" | "red" | "blue" | "gray"> = {
  approved: "green",
  request_changes: "red",
  commented: "blue",
};

export default async function ReviewsTable() {
  const { data: reviews, total } = await fetchReviews();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {reviews.length} of {total} reviews
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              {["ID", "Repo", "PR #", "Commit", "Decision", "Comments", "Processing", "Date"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-gray-950 divide-y divide-gray-800/60">
            {reviews.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-600">
                  No reviews found.
                </td>
              </tr>
            )}
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-gray-900/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-600 font-mono">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-200 max-w-[200px] truncate">
                  {r.repoFullName}
                </td>
                <td className="px-4 py-3 text-sm text-indigo-400 font-mono">#{r.prNumber}</td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                  {r.commitSha.slice(0, 7)}
                </td>
                <td className="px-4 py-3">
                  {r.decision ? (
                    <Badge color={decisionBadge[r.decision] ?? "gray"}>
                      {r.decision.replace("_", " ")}
                    </Badge>
                  ) : (
                    <span className="text-gray-700 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 text-center">{r.commentCount}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {r.processingMs != null ? `${(r.processingMs / 1000).toFixed(1)}s` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
