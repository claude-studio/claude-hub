import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { reviews, reviewComments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { decisionStyle } from "@/lib/reviewStyles";

export const dynamic = "force-dynamic";

const severityStyle: Record<string, { color: string; bg: string }> = {
  critical: { color: "#b91c1c", bg: "#fee2e2" },
  warning: { color: "#a16207", bg: "#fef9c3" },
  info: { color: "#1d4ed8", bg: "#dbeafe" },
};


async function getReview(id: number) {
  const reviewPromise = db.select().from(reviews).where(eq(reviews.id, id));
  const commentsPromise = db.select().from(reviewComments).where(eq(reviewComments.reviewId, id));
  const [[review], comments] = await Promise.all([reviewPromise, commentsPromise]);
  if (!review) return null;
  return { review, comments };
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getReview(Number(id));
  if (!data) notFound();

  const { review, comments } = data;
  const decision = review.decision ? decisionStyle[review.decision] : null;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b sticky top-0 z-10"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <Link
          href="/reviews"
          className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Reviews
        </Link>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text-tertiary)" }}>
          <path d="M5 2l4 5-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {review.repoFullName} PR #{review.prNumber}
        </span>

        <div className="flex-1" />

        {decision && (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ color: decision.color, background: decision.bg }}
          >
            {decision.label}
          </span>
        )}
        {review.processingMs !== null && (
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {(review.processingMs / 1000).toFixed(1)}s
          </span>
        )}
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {new Date(review.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          {/* Meta */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              G
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {review.repoFullName}
              </p>
              <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                {review.commitSha}
              </p>
            </div>
          </div>

          {/* Claude response */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ background: "var(--surface-secondary)", borderColor: "var(--border)" }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                G
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Claude Response
              </span>
            </div>
            <div className="px-4 py-4">
              {review.summary ? (
                <MarkdownRenderer content={review.summary} />
              ) : (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No summary available.</p>
              )}
            </div>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Parsed Comments · {comments.length}
              </h2>
              {comments.map((c) => {
                const sev = c.severity ? severityStyle[c.severity] : null;
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border p-4 space-y-2"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {sev && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: sev.color, background: sev.bg }}
                        >
                          {c.severity}
                        </span>
                      )}
                      {c.category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{ color: "var(--text-secondary)", borderColor: "var(--border-strong)", background: "var(--surface-secondary)" }}
                        >
                          {c.category}
                        </span>
                      )}
                      {c.filePath && (
                        <code className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                          {c.filePath}{c.lineNumber !== null ? `:${c.lineNumber}` : ""}
                        </code>
                      )}
                    </div>
                    <MarkdownRenderer content={c.body} />
                  </div>
                );
              })}
            </div>
          )}

          {comments.length === 0 && (
            <div
              className="rounded-xl border p-8 text-center text-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-tertiary)" }}
            >
              No parsed comments for this review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
