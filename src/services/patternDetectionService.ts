import { db } from '../db';
import { reviewComments, ruleSuggestions } from '../db/schema';
import type { NewRuleSuggestion } from '../db/schema';
import { sql, gte, count } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('patternDetectionService');

const WINDOW_DAYS = parseInt(process.env['RULE_SUGGEST_WINDOW_DAYS'] ?? '14', 10);
const THRESHOLD = parseInt(process.env['RULE_SUGGEST_THRESHOLD'] ?? '5', 10);

interface PatternGroup {
  repoFullName: string;
  category: string;
  patternKey: string;
  occurrenceCount: number;
  sampleBody: string;
}

/**
 * Extracts a normalized pattern key from a comment body.
 * Groups similar comments by extracting the first meaningful sentence.
 */
function extractPatternKey(body: string): string {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`[^`]+`/g, 'CODE') // replace inline code
    .replace(/https?:\/\/\S+/g, 'URL') // replace URLs
    .replace(/\s+/g, ' ')
    .trim();

  // Take first sentence (up to 120 chars)
  const firstSentence = cleaned.split(/[.!?]/)[0]?.trim() ?? cleaned;
  return firstSentence.slice(0, 120).toLowerCase();
}

/**
 * Generates a suggested CLAUDE.md rule from a pattern.
 */
function generateRuleText(category: string, patternKey: string, count: number): string {
  const examples: Record<string, string> = {
    accessibility: `## Accessibility Rule\n- Ensure all interactive elements have proper ARIA labels\n- Pattern detected: "${patternKey}"\n- Seen ${count} times in reviews`,
    'type-safety': `## Type Safety Rule\n- Avoid using \`any\` type; use explicit types or \`unknown\`\n- Pattern detected: "${patternKey}"\n- Seen ${count} times in reviews`,
    'bundle-size': `## Bundle Size Rule\n- Avoid large imports; use tree-shakeable alternatives\n- Pattern detected: "${patternKey}"\n- Seen ${count} times in reviews`,
    convention: `## Convention Rule\n- Follow project naming and code style conventions\n- Pattern detected: "${patternKey}"\n- Seen ${count} times in reviews`
  };

  return (
    examples[category] ??
    `## Review Rule (${category})\n- Pattern: "${patternKey}"\n- Detected ${count} times — consider adding this as a project rule`
  );
}

/**
 * Detects repetitive patterns in review comments within the time window
 * and generates rule suggestions when threshold is exceeded.
 */
export async function detectPatterns(): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);

  try {
    const comments = await db
      .select({
        id: reviewComments.id,
        reviewId: reviewComments.reviewId,
        category: reviewComments.category,
        body: reviewComments.body,
        createdAt: reviewComments.createdAt
      })
      .from(reviewComments)
      .where(gte(reviewComments.createdAt, since));

    // Group by pattern key
    const patternMap = new Map<string, PatternGroup>();

    for (const comment of comments) {
      if (!comment.category || !comment.body) continue;

      const patternKey = extractPatternKey(comment.body);
      const mapKey = `${comment.category}::${patternKey}`;

      const existing = patternMap.get(mapKey);
      if (existing) {
        existing.occurrenceCount++;
      } else {
        patternMap.set(mapKey, {
          repoFullName: 'all',
          category: comment.category,
          patternKey,
          occurrenceCount: 1,
          sampleBody: comment.body
        });
      }
    }

    // Filter patterns that exceed threshold
    const triggeredPatterns = [...patternMap.values()].filter(p => p.occurrenceCount >= THRESHOLD);

    if (triggeredPatterns.length === 0) {
      logger.info(
        { threshold: THRESHOLD, windowDays: WINDOW_DAYS },
        'No patterns exceeded threshold'
      );
      return 0;
    }

    // Deduplicate against existing suggestions
    const existingSuggestions = await db
      .select({ patternDescription: ruleSuggestions.patternDescription })
      .from(ruleSuggestions);

    const existingPatterns = new Set(existingSuggestions.map(s => s.patternDescription));

    const newSuggestions: NewRuleSuggestion[] = triggeredPatterns
      .filter(p => !existingPatterns.has(p.patternKey))
      .map(p => ({
        repoFullName: p.repoFullName,
        category: p.category,
        patternDescription: p.patternKey,
        suggestedRuleText: generateRuleText(p.category, p.patternKey, p.occurrenceCount),
        occurrenceCount: p.occurrenceCount,
        status: 'pending' as const
      }));

    if (newSuggestions.length === 0) {
      logger.info('All triggered patterns already have suggestions');
      return 0;
    }

    await db.insert(ruleSuggestions).values(newSuggestions);

    logger.info({ count: newSuggestions.length }, 'Created rule suggestions');
    return newSuggestions.length;
  } catch (err) {
    logger.error({ err }, 'Pattern detection failed');
    return 0;
  }
}

/**
 * Returns analytics data for the dashboard.
 */
export async function getAnalytics(_repoFullName?: string) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Category distribution
    const categoryStats = await db
      .select({
        category: reviewComments.category,
        count: count()
      })
      .from(reviewComments)
      .where(gte(reviewComments.createdAt, since))
      .groupBy(reviewComments.category);

    // Severity distribution
    const severityStats = await db
      .select({
        severity: reviewComments.severity,
        count: count()
      })
      .from(reviewComments)
      .where(gte(reviewComments.createdAt, since))
      .groupBy(reviewComments.severity);

    // Suggestion status distribution
    const suggestionStats = await db
      .select({
        status: ruleSuggestions.status,
        count: count()
      })
      .from(ruleSuggestions)
      .groupBy(ruleSuggestions.status);

    // Weekly comment trend (last 4 weeks)
    const weeklyTrend = await db.execute(
      sql`
        SELECT
          date_trunc('week', created_at) AS week,
          COUNT(*) AS count,
          severity
        FROM review_comments
        WHERE created_at >= NOW() - INTERVAL '4 weeks'
        GROUP BY week, severity
        ORDER BY week
      `
    );

    return {
      categoryStats,
      severityStats,
      suggestionStats,
      weeklyTrend: weeklyTrend.rows
    };
  } catch (err) {
    logger.error({ err }, 'Analytics query failed');
    return { categoryStats: [], severityStats: [], suggestionStats: [], weeklyTrend: [] };
  }
}
