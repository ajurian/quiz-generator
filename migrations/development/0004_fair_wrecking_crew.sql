CREATE TABLE "quiz_attempt_answers" (
	"quiz_attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" varchar(255) NOT NULL,
	CONSTRAINT "quiz_attempt_answers_quiz_attempt_id_question_id_pk" PRIMARY KEY("quiz_attempt_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_quiz_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("quiz_attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempt_answers_attempt_idx" ON "quiz_attempt_answers" USING btree ("quiz_attempt_id");