import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, reviewComments } from '@/lib/schema';
import { sql, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // async-parallel: run all independent DB queries concurrently
    const [
      categoryStats,
      severityStats,
      decisionStats,
      weeklyTrend,
      dailyTrend,
      topRepos,
      totalReviewsResult,
      totalCommentsResult,
    ] = await Promise.all([
      db.select({
        category: reviewComments.category,
        count: sql<number>`count(*)`.as('count'),
      })
        .from(reviewComments)
        .groupBy(reviewComments.category)
        .orderBy(desc(sql`count(*)`)),

      db.select({
        severity: reviewComments.severity,
        count: sql<number>`count(*)`.as('count'),
      })
        .from(reviewComments)
        .groupBy(reviewComments.severity)
        .orderBy(desc(sql`count(*)`)),

      db.select({
        decision: reviews.decision,
        count: sql<number>`count(*)`.as('count'),
      })
        .from(reviews)
        .groupBy(reviews.decision)
        .orderBy(desc(sql`count(*)`)),

      db.select({
        week: sql<string>`date_trunc('week', ${reviews.createdAt})::date`.as('week'),
        count: sql<number>`count(*)`.as('count'),
      })
        .from(reviews)
        .where(sql`${reviews.createdAt} >= now() - interval '7 weeks'`)
        .groupBy(sql`date_trunc('week', ${reviews.createdAt})`)
        .orderBy(sql`date_trunc('week', ${reviews.createdAt})`),

      db.select({
        day: sql<string>`date_trunc('day', ${reviews.createdAt})::date`.as('day'),
        count: sql<number>`count(*)`.as('count'),
      })
        .from(reviews)
        .where(sql`${reviews.createdAt} >= now() - interval '30 days'`)
        .groupBy(sql`date_trunc('day', ${reviews.createdAt})`)
        .orderBy(sql`date_trunc('day', ${reviews.createdAt})`),

      db.select({
        repoFullName: reviews.repoFullName,
        reviewCount: sql<number>`count(*)`.as('review_count'),
      })
        .from(reviews)
        .groupBy(reviews.repoFullName)
        .orderBy(desc(sql`count(*)`))
        .limit(10),

      db.select({ count: sql<number>`count(*)` }).from(reviews),
      db.select({ count: sql<number>`count(*)` }).from(reviewComments),
    ]);

    return NextResponse.json({
      totalReviews: Number(totalReviewsResult[0]?.count ?? 0),
      totalComments: Number(totalCommentsResult[0]?.count ?? 0),
      categoryStats: categoryStats.map(r => ({
        category: r.category ?? 'uncategorized',
        count: Number(r.count),
      })),
      severityStats: severityStats.map(r => ({
        severity: r.severity ?? 'unknown',
        count: Number(r.count),
      })),
      decisionStats: decisionStats.map(r => ({
        decision: r.decision ?? 'unknown',
        count: Number(r.count),
      })),
      weeklyTrend: weeklyTrend.map(r => ({
        week: r.week,
        count: Number(r.count),
      })),
      dailyTrend: dailyTrend.map(r => ({
        day: r.day,
        count: Number(r.count),
      })),
      topRepos: topRepos.map(r => ({
        repoFullName: r.repoFullName,
        reviewCount: Number(r.reviewCount),
      })),
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
