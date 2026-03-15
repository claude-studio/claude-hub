import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, reviewComments } from '@/lib/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const rows = await db
      .select({
        id: reviews.id,
        prNumber: reviews.prNumber,
        repoFullName: reviews.repoFullName,
        commitSha: reviews.commitSha,
        decision: reviews.decision,
        summary: reviews.summary,
        processingMs: reviews.processingMs,
        createdAt: reviews.createdAt,
        commentCount: sql<number>`count(${reviewComments.id})`.as('comment_count'),
      })
      .from(reviews)
      .leftJoin(reviewComments, sql`${reviewComments.reviewId} = ${reviews.id}`)
      .groupBy(reviews.id)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews);

    return NextResponse.json({
      data: rows,
      total: Number(total[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
