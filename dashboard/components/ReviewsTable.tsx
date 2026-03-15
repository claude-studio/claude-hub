import Link from 'next/link';
import { db } from '@/lib/db';
import { reviews as reviewsTable, reviewComments } from '@/lib/schema';
import { desc, sql } from 'drizzle-orm';
import { decisionStyle } from '@/lib/reviewStyles';

interface ReviewRow {
  id: number;
  prNumber: number;
  repoFullName: string;
  commitSha: string;
  decision: 'approved' | 'request_changes' | 'commented' | null;
  summary: string | null;
  processingMs: number | null;
  createdAt: Date;
  commentCount: number;
}

async function fetchReviews(): Promise<{ data: ReviewRow[]; total: number }> {
  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: reviewsTable.id,
        prNumber: reviewsTable.prNumber,
        repoFullName: reviewsTable.repoFullName,
        commitSha: reviewsTable.commitSha,
        decision: reviewsTable.decision,
        summary: reviewsTable.summary,
        processingMs: reviewsTable.processingMs,
        createdAt: reviewsTable.createdAt,
        commentCount: sql<number>`count(${reviewComments.id})`.as('comment_count')
      })
      .from(reviewsTable)
      .leftJoin(reviewComments, sql`${reviewComments.reviewId} = ${reviewsTable.id}`)
      .groupBy(reviewsTable.id)
      .orderBy(desc(reviewsTable.createdAt))
      .limit(50),

    db.select({ count: sql<number>`count(*)` }).from(reviewsTable)
  ]);

  return {
    data: rows as ReviewRow[],
    total: Number(totalResult[0]?.count ?? 0)
  };
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
    .replace(/`[^`]+`/g, '') // 인라인 코드 제거
    .replace(/^#{1,6}\s+/gm, '') // 헤더 기호 제거
    .replace(/[*_~>]/g, '') // 강조, 취소선, 인용 제거
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 텍스트만 남김
    .replace(/\n{3,}/g, '\n\n') // 3줄 이상 연속 줄바꿈 → 2줄로 축소
    .trim();
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function ReviewsTable() {
  const { data: reviews, total } = await fetchReviews();

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-6 py-3 border-b text-sm sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-sm border-b-2 transition-colors"
          style={{
            color: 'var(--accent)',
            borderColor: 'var(--accent)',
            borderRadius: 0,
            borderWidth: '0 0 2px 0',
            paddingBottom: '6px',
            marginBottom: '-1px'
          }}
        >
          All reviews
          <span
            className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-1.5 min-w-[20px] h-5"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {total}
          </span>
        </button>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          1–{reviews.length} of {total}
        </span>
      </div>

      {/* Cards */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-secondary)' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <path
                d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4m0 4h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            No reviews yet
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Reviews will appear here after bot mentions
          </p>
        </div>
      ) : (
        <div>
          {reviews.map(r => {
            const decision = r.decision ? decisionStyle[r.decision] : null;
            const summary = r.summary ? stripMarkdown(r.summary).slice(0, 200) : '';
            const repoShort = r.repoFullName.split('/').pop() ?? r.repoFullName;

            return (
              <Link
                key={r.id}
                href={`/reviews/${r.id}`}
                className="group block border-b transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="px-6 py-4 transition-colors group-hover:bg-blue-50/40">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {timeAgo(r.createdAt)}
                    </span>
                    <span style={{ color: 'var(--border-strong)' }}>·</span>
                    <span
                      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                      style={{
                        background: 'var(--surface-secondary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {r.commitSha.slice(0, 7)}
                    </span>
                  </div>

                  {/* Title */}
                  <p
                    className="text-sm font-semibold mb-1 leading-snug group-hover:text-blue-600 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {repoShort}{' '}
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                      PR #{r.prNumber}
                    </span>
                  </p>

                  {/* Summary */}
                  {summary && (
                    <p
                      className="text-sm leading-relaxed mb-3 line-clamp-3 whitespace-pre-line"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {summary}
                    </p>
                  )}

                  {/* Tags row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Repo tag */}
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        color: 'var(--text-secondary)',
                        borderColor: 'var(--border-strong)',
                        background: 'var(--surface-secondary)'
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1 9V3.5L5 1l4 2.5V9"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3.5 9V6.5h3V9"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {r.repoFullName}
                    </span>

                    {/* Decision badge */}
                    {decision && (
                      <span
                        className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: decision.color, background: decision.bg }}
                      >
                        {decision.label}
                      </span>
                    )}

                    {/* Comment count */}
                    {Number(r.commentCount) > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path
                            d="M1 1h9v7H6.5L5 9.5 3.5 8H1V1z"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {r.commentCount} comment{Number(r.commentCount) !== 1 ? 's' : ''}
                      </span>
                    )}

                    {/* Processing time */}
                    {r.processingMs !== null && (
                      <span
                        className="inline-flex items-center gap-1 text-xs ml-auto"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
                          <path
                            d="M5.5 3v2.5l1.5 1"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                          />
                        </svg>
                        {(r.processingMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
