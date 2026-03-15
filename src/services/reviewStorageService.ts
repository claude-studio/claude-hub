import { db } from '../db';
import { reviews, reviewComments } from '../db/schema';
import type { NewReview, NewReviewComment } from '../db/schema';
import { createLogger } from '../utils/logger';

const logger = createLogger('reviewStorageService');

const CATEGORY_KEYWORDS = ['accessibility', 'type-safety', 'bundle-size', 'convention'] as const;
const SEVERITY_PATTERNS: Array<{ severity: 'critical' | 'warning' | 'info'; patterns: RegExp[] }> =
  [
    {
      severity: 'critical',
      patterns: [/critical/i, /request_changes/i, /❌/]
    },
    {
      severity: 'warning',
      patterns: [/warning/i, /⚠️/]
    },
    {
      severity: 'info',
      patterns: [/info/i, /ℹ️/, /approved/i, /✅/]
    }
  ];

function parseDecision(text: string): 'approved' | 'request_changes' | 'commented' | null {
  if (/REQUEST_CHANGES|request.changes/i.test(text)) return 'request_changes';
  if (/APPROVE[^D]|approved/i.test(text)) return 'approved';
  if (/COMMENT/i.test(text)) return 'commented';
  return null;
}

function parseCategories(text: string): string[] {
  return CATEGORY_KEYWORDS.filter(cat => text.toLowerCase().includes(cat));
}

function parseSeverity(text: string): 'critical' | 'warning' | 'info' | null {
  for (const { severity, patterns } of SEVERITY_PATTERNS) {
    if (patterns.some(p => p.test(text))) return severity;
  }
  return null;
}

function parseComments(responseText: string, reviewId: number): NewReviewComment[] {
  const comments: NewReviewComment[] = [];

  // Split by markdown headers or bullet points to find individual feedback items
  const sections = responseText.split(/\n(?=#{1,3} |[-*] |\d+\. )/);

  for (const section of sections) {
    if (section.trim().length < 20) continue;

    const category = parseCategories(section)[0] ?? null;
    const severity = parseSeverity(section);

    // Extract file path if mentioned (e.g., `src/components/Foo.tsx` or **src/Foo.tsx**)
    const fileMatch = section.match(
      /[`*]{0,2}((?:src|app|pages|components|packages)\/[\w/.%-]+\.\w+)[`*]{0,2}/
    );
    const filePath = fileMatch?.[1] ?? null;

    // Extract line number if mentioned
    const lineMatch = section.match(/line[s]?\s*(\d+)/i);
    const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null;

    if (category || severity) {
      comments.push({
        reviewId,
        filePath,
        lineNumber,
        severity,
        category,
        body: section.trim().substring(0, 2000)
      });
    }
  }

  return comments;
}

export async function storeReviewResult({
  prNumber,
  repoFullName,
  commitSha,
  responseText,
  processingMs
}: {
  prNumber: number;
  repoFullName: string;
  commitSha: string;
  responseText: string;
  processingMs: number;
}): Promise<void> {
  try {
    const decision = parseDecision(responseText);

    // Store review
    const [review] = await db
      .insert(reviews)
      .values({
        prNumber,
        repoFullName,
        commitSha,
        decision,
        summary: responseText.substring(0, 1000),
        processingMs
      } satisfies NewReview)
      .returning({ id: reviews.id });

    if (!review) {
      logger.warn({ prNumber, repoFullName }, 'Failed to insert review record');
      return;
    }

    // Parse and store individual comments
    const parsedComments = parseComments(responseText, review.id);

    if (parsedComments.length > 0) {
      await db.insert(reviewComments).values(parsedComments);
    }

    logger.info(
      {
        reviewId: review.id,
        prNumber,
        repoFullName,
        decision,
        commentsCount: parsedComments.length,
        processingMs
      },
      'Review result stored successfully'
    );
  } catch (error) {
    // Non-blocking — log and continue
    logger.warn(
      { err: (error as Error).message, prNumber, repoFullName },
      'Failed to store review result in DB'
    );
  }
}
