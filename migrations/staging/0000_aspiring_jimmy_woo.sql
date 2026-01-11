CREATE TYPE "public"."question_type" AS ENUM('direct_question', 'two_statement_compound', 'contextual');--> statement-breakpoint
CREATE TYPE "public"."quiz_attempt_status" AS ENUM('in_progress', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."quiz_status" AS ENUM('generating', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."quiz_visibility" AS ENUM('private', 'unlisted', 'public');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quiz_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"type" "question_type" NOT NULL,
	"stem" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_explanation" text NOT NULL,
	"source_quote" text NOT NULL,
	"reference" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(22) NOT NULL,
	"quiz_id" uuid NOT NULL,
	"user_id" uuid,
	"status" "quiz_attempt_status" DEFAULT 'in_progress' NOT NULL,
	"score" real,
	"duration_ms" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "quiz_attempts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(22) NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"question_distribution" integer NOT NULL,
	"visibility" "quiz_visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" "quiz_status" DEFAULT 'generating' NOT NULL,
	"error_message" text,
	CONSTRAINT "quizzes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "source_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quiz_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"file_key" text NOT NULL,
	"mime_type" varchar(127) NOT NULL,
	"size_bytes" integer NOT NULL,
	"quiz_reference_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_materials" ADD CONSTRAINT "source_materials_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_user_idx" ON "quiz_attempts" USING btree ("quiz_id","user_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_user_submitted_idx" ON "quiz_attempts" USING btree ("quiz_id","user_id","submitted_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verifications" USING btree ("identifier");