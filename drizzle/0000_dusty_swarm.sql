CREATE TYPE "public"."review_decision" AS ENUM('approved', 'request_changes', 'commented');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('critical', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'adopted', 'dismissed');--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"file_path" text,
	"line_number" integer,
	"severity" "severity",
	"category" text,
	"body" text NOT NULL,
	"github_comment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"pr_number" integer NOT NULL,
	"repo_full_name" text NOT NULL,
	"commit_sha" text NOT NULL,
	"decision" "review_decision",
	"summary" text,
	"processing_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"repo_full_name" text NOT NULL,
	"category" text NOT NULL,
	"pattern_description" text NOT NULL,
	"suggested_rule_text" text NOT NULL,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;