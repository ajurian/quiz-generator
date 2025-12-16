CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(22) NOT NULL,
	"quiz_id" uuid NOT NULL,
	"user_id" uuid,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"score" real,
	"duration_ms" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	CONSTRAINT "quiz_attempts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "slug" varchar(22) NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "visibility" varchar(20) DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_user_idx" ON "quiz_attempts" USING btree ("quiz_id","user_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_user_submitted_idx" ON "quiz_attempts" USING btree ("quiz_id","user_id","submitted_at");--> statement-breakpoint
ALTER TABLE "quizzes" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_slug_unique" UNIQUE("slug");