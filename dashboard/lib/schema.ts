import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const reviewDecisionEnum = pgEnum('review_decision', [
  'approved',
  'request_changes',
  'commented'
]);

export const severityEnum = pgEnum('severity', ['critical', 'warning', 'info']);

export const suggestionStatusEnum = pgEnum('suggestion_status', [
  'pending',
  'adopted',
  'dismissed'
]);

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  prNumber: integer('pr_number').notNull(),
  repoFullName: text('repo_full_name').notNull(),
  commitSha: text('commit_sha').notNull(),
  decision: reviewDecisionEnum('decision'),
  summary: text('summary'),
  processingMs: integer('processing_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const reviewComments = pgTable('review_comments', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id')
    .references(() => reviews.id)
    .notNull(),
  filePath: text('file_path'),
  lineNumber: integer('line_number'),
  severity: severityEnum('severity'),
  category: text('category'),
  body: text('body').notNull(),
  githubCommentId: integer('github_comment_id'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const ruleSuggestions = pgTable('rule_suggestions', {
  id: serial('id').primaryKey(),
  repoFullName: text('repo_full_name').notNull(),
  category: text('category').notNull(),
  patternDescription: text('pattern_description').notNull(),
  suggestedRuleText: text('suggested_rule_text').notNull(),
  occurrenceCount: integer('occurrence_count').default(1).notNull(),
  status: suggestionStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export type Review = typeof reviews.$inferSelect;
export type ReviewComment = typeof reviewComments.$inferSelect;
export type RuleSuggestion = typeof ruleSuggestions.$inferSelect;
