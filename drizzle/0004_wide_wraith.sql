CREATE TYPE "public"."question_type" AS ENUM('single_best_answer', 'two_statements', 'contextual');--> statement-breakpoint
ALTER TABLE "questions" RENAME COLUMN "question_text" TO "stem";--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "question_type" SET DATA TYPE "public"."question_type" USING "question_type"::"public"."question_type";