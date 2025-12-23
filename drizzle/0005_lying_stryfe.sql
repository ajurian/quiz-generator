CREATE TYPE "public"."quiz_attempt_status" AS ENUM('in_progress', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."quiz_visibility" AS ENUM('private', 'unlisted', 'public');--> statement-breakpoint
ALTER TABLE "quiz_attempts" ALTER COLUMN "status" SET DEFAULT 'in_progress'::"public"."quiz_attempt_status";--> statement-breakpoint
ALTER TABLE "quiz_attempts" ALTER COLUMN "status" SET DATA TYPE "public"."quiz_attempt_status" USING "status"::"public"."quiz_attempt_status";--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "visibility" SET DEFAULT 'private'::"public"."quiz_visibility";--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "visibility" SET DATA TYPE "public"."quiz_visibility" USING "visibility"::"public"."quiz_visibility";