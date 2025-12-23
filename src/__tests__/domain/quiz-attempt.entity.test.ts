import { describe, expect, it } from "bun:test";
import {
  QuizAttempt,
  type QuizAttemptProps,
  type CreateQuizAttemptProps,
} from "../../domain/entities/quiz-attempt.entity";
import { AttemptStatus } from "../../domain/enums/attempt-status.enum";

describe("QuizAttempt Entity", () => {
  // Valid UUIDs for testing
  const ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c2";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const OTHER_USER_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";

  // Helper to create valid create props
  const createValidCreateProps = (
    overrides?: Partial<CreateQuizAttemptProps>
  ): CreateQuizAttemptProps => ({
    id: ATTEMPT_ID,
    quizId: QUIZ_ID,
    userId: USER_ID,
    ...overrides,
  });

  // Helper to create valid reconstitute props
  const createValidProps = (
    overrides?: Partial<QuizAttemptProps>
  ): QuizAttemptProps => ({
    id: ATTEMPT_ID,
    slug: "AZshk0egcAAKcS5bxcMTwQ",
    quizId: QUIZ_ID,
    userId: USER_ID,
    status: AttemptStatus.IN_PROGRESS,
    score: null,
    durationMs: null,
    startedAt: new Date("2024-01-01T10:00:00Z"),
    submittedAt: null,
    answers: {},
    ...overrides,
  });

  describe("create", () => {
    it("should create a valid QuizAttempt", () => {
      const props = createValidCreateProps();
      const attempt = QuizAttempt.create(props);

      expect(attempt.id).toBe(ATTEMPT_ID);
      expect(attempt.quizId).toBe(QUIZ_ID);
      expect(attempt.userId).toBe(USER_ID);
      expect(attempt.status).toBe(AttemptStatus.IN_PROGRESS);
      expect(attempt.score).toBeNull();
      expect(attempt.durationMs).toBeNull();
      expect(attempt.startedAt).toBeInstanceOf(Date);
      expect(attempt.submittedAt).toBeNull();
      expect(attempt.answers).toEqual({});
    });

    it("should create attempt with empty answers by default", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      expect(attempt.answers).toEqual({});
    });

    it("should create attempt with initial answers when provided", () => {
      const initialAnswers = { q1: "A", q2: "B", q3: "C" };
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: initialAnswers })
      );
      expect(attempt.answers).toEqual(initialAnswers);
    });

    it("should create attempt with null userId for anonymous attempts", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ userId: null })
      );
      expect(attempt.userId).toBeNull();
    });

    it("should generate a valid slug from UUID", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      expect(attempt.slug).toHaveLength(22);
      expect(attempt.slug).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    describe("validation errors", () => {
      it("should throw for missing id", () => {
        expect(() =>
          QuizAttempt.create(createValidCreateProps({ id: "" }))
        ).toThrow("Attempt ID is required");
      });

      it("should throw for missing quizId", () => {
        expect(() =>
          QuizAttempt.create(createValidCreateProps({ quizId: "" }))
        ).toThrow("Quiz ID is required");
      });

      it("should throw for invalid userId type", () => {
        expect(() =>
          QuizAttempt.create(
            createValidCreateProps({ userId: 123 as unknown as string })
          )
        ).toThrow("User ID must be a string or null");
      });
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute a valid QuizAttempt", () => {
      const props = createValidProps();
      const attempt = QuizAttempt.reconstitute(props);

      expect(attempt.id).toBe(props.id);
      expect(attempt.slug).toBe(props.slug);
      expect(attempt.quizId).toBe(props.quizId);
      expect(attempt.userId).toBe(props.userId);
      expect(attempt.status).toBe(props.status);
      expect(attempt.score).toBe(props.score);
      expect(attempt.durationMs).toBe(props.durationMs);
      expect(attempt.startedAt).toEqual(props.startedAt);
      expect(attempt.submittedAt).toBe(props.submittedAt);
      expect(attempt.answers).toEqual(props.answers);
    });

    it("should reconstitute submitted attempt with answers", () => {
      const savedAnswers = { q1: "A", q2: "C", q3: "B" };
      const props = createValidProps({
        status: AttemptStatus.SUBMITTED,
        score: 85,
        durationMs: 120000,
        submittedAt: new Date("2024-01-01T10:02:00Z"),
        answers: savedAnswers,
      });
      const attempt = QuizAttempt.reconstitute(props);

      expect(attempt.answers).toEqual(savedAnswers);
      expect(attempt.score).toBe(85);
      expect(attempt.isSubmitted).toBe(true);
    });

    describe("validation errors", () => {
      it("should throw for missing slug", () => {
        expect(() =>
          QuizAttempt.reconstitute(createValidProps({ slug: "" }))
        ).toThrow("Attempt slug is required");
      });

      it("should throw for invalid status", () => {
        expect(() =>
          QuizAttempt.reconstitute(
            createValidProps({ status: "invalid" as AttemptStatus })
          )
        ).toThrow("status must be a valid AttemptStatus value");
      });

      it("should throw for negative score", () => {
        expect(() =>
          QuizAttempt.reconstitute(createValidProps({ score: -5 }))
        ).toThrow("Score must be a non-negative number or null");
      });

      it("should throw for negative duration", () => {
        expect(() =>
          QuizAttempt.reconstitute(createValidProps({ durationMs: -1000 }))
        ).toThrow("Duration must be a non-negative number or null");
      });

      it("should throw for null answers", () => {
        expect(() =>
          QuizAttempt.reconstitute(
            createValidProps({
              answers: null as unknown as Record<string, string>,
            })
          )
        ).toThrow("Answers must be an object");
      });

      it("should throw for array answers", () => {
        expect(() =>
          QuizAttempt.reconstitute(
            createValidProps({
              answers: [] as unknown as Record<string, string>,
            })
          )
        ).toThrow("Answers must be an object");
      });
    });
  });

  describe("answers getter", () => {
    it("should return a copy of answers (immutability)", () => {
      const originalAnswers = { q1: "A", q2: "B" };
      const attempt = QuizAttempt.reconstitute(
        createValidProps({ answers: originalAnswers })
      );

      const answers = attempt.answers;
      answers.q1 = "X"; // Modify the returned copy

      expect(attempt.answers.q1).toBe("A"); // Original should be unchanged
    });
  });

  describe("submit", () => {
    it("should submit attempt with score and answers", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      const answers = { q1: "A", q2: "C", q3: "B" };

      attempt.submit(85, answers);

      expect(attempt.status).toBe(AttemptStatus.SUBMITTED);
      expect(attempt.score).toBe(85);
      expect(attempt.answers).toEqual(answers);
      expect(attempt.submittedAt).toBeInstanceOf(Date);
      expect(attempt.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("should submit with zero score", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      attempt.submit(0, { q1: "A" });

      expect(attempt.score).toBe(0);
      expect(attempt.status).toBe(AttemptStatus.SUBMITTED);
    });

    it("should submit with perfect score", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      attempt.submit(100, { q1: "A", q2: "B", q3: "C" });

      expect(attempt.score).toBe(100);
    });

    it("should calculate duration on submit", () => {
      const startTime = new Date("2024-01-01T10:00:00Z");
      const props = createValidProps({ startedAt: startTime });
      const attempt = QuizAttempt.reconstitute(props);

      // Submit after some time has passed
      attempt.submit(75, {});

      expect(attempt.durationMs).toBeGreaterThan(0);
    });

    it("should throw when submitting already submitted attempt", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.SUBMITTED,
          score: 80,
        })
      );

      expect(() => attempt.submit(90, {})).toThrow(
        "Attempt has already been submitted"
      );
    });

    it("should throw for negative score", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());

      expect(() => attempt.submit(-10, {})).toThrow(
        "Score must be a non-negative number"
      );
    });

    it("should overwrite initial answers with submission answers", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A" } })
      );
      const newAnswers = { q1: "B", q2: "C" };

      attempt.submit(80, newAnswers);

      expect(attempt.answers).toEqual(newAnswers);
    });
  });

  describe("updateAnswers", () => {
    it("should update answers for in-progress attempt", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      const newAnswers = { q1: "B", q2: "D" };

      attempt.updateAnswers(newAnswers);

      expect(attempt.answers).toEqual(newAnswers);
    });

    it("should replace all previous answers", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A", q2: "B", q3: "C" } })
      );

      attempt.updateAnswers({ q1: "X" });

      expect(attempt.answers).toEqual({ q1: "X" });
    });

    it("should throw when updating submitted attempt", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.SUBMITTED,
          score: 80,
        })
      );

      expect(() => attempt.updateAnswers({ q1: "A" })).toThrow(
        "Cannot update answers on submitted attempt"
      );
    });
  });

  describe("updateAnswer (single)", () => {
    it("should update a single answer for in-progress attempt", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());

      attempt.updateAnswer("q1", "A");

      expect(attempt.answers).toEqual({ q1: "A" });
    });

    it("should add new answer while preserving existing ones", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A", q2: "B" } })
      );

      attempt.updateAnswer("q3", "C");

      expect(attempt.answers).toEqual({ q1: "A", q2: "B", q3: "C" });
    });

    it("should overwrite existing answer for same question", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A" } })
      );

      attempt.updateAnswer("q1", "B");

      expect(attempt.answers).toEqual({ q1: "B" });
    });

    it("should throw when updating submitted attempt", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.SUBMITTED,
          score: 80,
        })
      );

      expect(() => attempt.updateAnswer("q1", "A")).toThrow(
        "Cannot update answers on submitted attempt"
      );
    });

    it("should be idempotent when setting same value", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A" } })
      );

      attempt.updateAnswer("q1", "A");

      expect(attempt.answers).toEqual({ q1: "A" });
    });
  });

  describe("resetAnswers", () => {
    it("should clear all answers for in-progress attempt", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A", q2: "B", q3: "C" } })
      );

      attempt.resetAnswers();

      expect(attempt.answers).toEqual({});
      expect(Object.keys(attempt.answers).length).toBe(0);
    });

    it("should work when attempt has no answers", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());

      attempt.resetAnswers();

      expect(attempt.answers).toEqual({});
    });

    it("should preserve attempt status as in-progress", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A" } })
      );

      attempt.resetAnswers();

      expect(attempt.status).toBe(AttemptStatus.IN_PROGRESS);
      expect(attempt.isInProgress).toBe(true);
    });

    it("should throw when resetting submitted attempt", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.SUBMITTED,
          score: 80,
          answers: { q1: "A" },
        })
      );

      expect(() => attempt.resetAnswers()).toThrow(
        "Cannot reset answers on submitted attempt"
      );
    });
  });

  describe("reset", () => {
    it("should clear all answers for in-progress attempt", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A", q2: "B", q3: "C" } })
      );

      attempt.reset();

      expect(attempt.answers).toEqual({});
      expect(Object.keys(attempt.answers).length).toBe(0);
    });

    it("should reset startedAt to current time", () => {
      const oldStartTime = new Date("2024-01-01T10:00:00Z");
      const attempt = QuizAttempt.reconstitute(
        createValidProps({ startedAt: oldStartTime })
      );

      const beforeReset = Date.now();
      attempt.reset();
      const afterReset = Date.now();

      expect(attempt.startedAt.getTime()).toBeGreaterThanOrEqual(beforeReset);
      expect(attempt.startedAt.getTime()).toBeLessThanOrEqual(afterReset);
    });

    it("should reset status to IN_PROGRESS", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({ status: AttemptStatus.IN_PROGRESS })
      );

      attempt.reset();

      expect(attempt.status).toBe(AttemptStatus.IN_PROGRESS);
      expect(attempt.isInProgress).toBe(true);
    });

    it("should reset score to null", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.IN_PROGRESS,
          score: null,
        })
      );

      attempt.reset();

      expect(attempt.score).toBeNull();
    });

    it("should reset durationMs to null", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.IN_PROGRESS,
          durationMs: 60000,
        })
      );

      attempt.reset();

      expect(attempt.durationMs).toBeNull();
    });

    it("should reset submittedAt to null", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.IN_PROGRESS,
          submittedAt: null,
        })
      );

      attempt.reset();

      expect(attempt.submittedAt).toBeNull();
    });

    it("should preserve attempt id, slug, quizId, and userId", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          id: ATTEMPT_ID,
          slug: "AZshk0egcAAKcS5bxcMTwQ",
          quizId: QUIZ_ID,
          userId: USER_ID,
          answers: { q1: "A" },
        })
      );

      attempt.reset();

      expect(attempt.id).toBe(ATTEMPT_ID);
      expect(attempt.slug).toBe("AZshk0egcAAKcS5bxcMTwQ");
      expect(attempt.quizId).toBe(QUIZ_ID);
      expect(attempt.userId).toBe(USER_ID);
    });

    it("should work when attempt has no answers", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());

      attempt.reset();

      expect(attempt.answers).toEqual({});
    });

    it("should throw when resetting submitted attempt", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.SUBMITTED,
          score: 80,
          answers: { q1: "A" },
        })
      );

      expect(() => attempt.reset()).toThrow("Cannot reset a submitted attempt");
    });

    it("should allow continuing after reset (equivalent to fresh start)", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A", q2: "B" } })
      );

      attempt.reset();
      attempt.updateAnswer("q1", "C");
      attempt.updateAnswer("q3", "D");

      expect(attempt.answers).toEqual({ q1: "C", q3: "D" });
      expect(attempt.isInProgress).toBe(true);
    });

    it("should allow submission after reset", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ answers: { q1: "A" } })
      );

      attempt.reset();
      attempt.submit(100, { q1: "B", q2: "C" });

      expect(attempt.isSubmitted).toBe(true);
      expect(attempt.score).toBe(100);
      expect(attempt.answers).toEqual({ q1: "B", q2: "C" });
    });
  });

  describe("computed properties", () => {
    describe("isInProgress", () => {
      it("should return true for in-progress attempt", () => {
        const attempt = QuizAttempt.create(createValidCreateProps());
        expect(attempt.isInProgress).toBe(true);
      });

      it("should return false for submitted attempt", () => {
        const attempt = QuizAttempt.reconstitute(
          createValidProps({ status: AttemptStatus.SUBMITTED })
        );
        expect(attempt.isInProgress).toBe(false);
      });
    });

    describe("isSubmitted", () => {
      it("should return true for submitted attempt", () => {
        const attempt = QuizAttempt.reconstitute(
          createValidProps({ status: AttemptStatus.SUBMITTED })
        );
        expect(attempt.isSubmitted).toBe(true);
      });

      it("should return false for in-progress attempt", () => {
        const attempt = QuizAttempt.create(createValidCreateProps());
        expect(attempt.isSubmitted).toBe(false);
      });
    });

    describe("formattedDuration", () => {
      it("should return null when duration is null", () => {
        const attempt = QuizAttempt.create(createValidCreateProps());
        expect(attempt.formattedDuration).toBeNull();
      });

      it("should format seconds only", () => {
        const attempt = QuizAttempt.reconstitute(
          createValidProps({ durationMs: 45000 })
        );
        expect(attempt.formattedDuration).toBe("45s");
      });

      it("should format minutes and seconds", () => {
        const attempt = QuizAttempt.reconstitute(
          createValidProps({ durationMs: 125000 })
        );
        expect(attempt.formattedDuration).toBe("2m 5s");
      });
    });
  });

  describe("isOwnedBy", () => {
    it("should return true for owner", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      expect(attempt.isOwnedBy(USER_ID)).toBe(true);
    });

    it("should return false for different user", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      expect(attempt.isOwnedBy(OTHER_USER_ID)).toBe(false);
    });

    it("should return false for anonymous attempt", () => {
      const attempt = QuizAttempt.create(
        createValidCreateProps({ userId: null })
      );
      expect(attempt.isOwnedBy(USER_ID)).toBe(false);
    });

    it("should return false when checking with null", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      expect(attempt.isOwnedBy(null)).toBe(false);
    });
  });

  describe("countsForStats", () => {
    it("should return true for submitted attempt", () => {
      const attempt = QuizAttempt.reconstitute(
        createValidProps({ status: AttemptStatus.SUBMITTED })
      );
      expect(attempt.countsForStats()).toBe(true);
    });

    it("should return false for in-progress attempt", () => {
      const attempt = QuizAttempt.create(createValidCreateProps());
      expect(attempt.countsForStats()).toBe(false);
    });
  });

  describe("toPlain", () => {
    it("should return all properties as plain object", () => {
      const answers = { q1: "A", q2: "B" };
      const attempt = QuizAttempt.reconstitute(
        createValidProps({
          status: AttemptStatus.SUBMITTED,
          score: 90,
          durationMs: 60000,
          submittedAt: new Date("2024-01-01T10:01:00Z"),
          answers,
        })
      );

      const plain = attempt.toPlain();

      expect(plain.id).toBe(ATTEMPT_ID);
      expect(plain.slug).toBe("AZshk0egcAAKcS5bxcMTwQ");
      expect(plain.quizId).toBe(QUIZ_ID);
      expect(plain.userId).toBe(USER_ID);
      expect(plain.status).toBe(AttemptStatus.SUBMITTED);
      expect(plain.score).toBe(90);
      expect(plain.durationMs).toBe(60000);
      expect(plain.answers).toEqual(answers);
    });

    it("should return a copy of answers (immutability)", () => {
      const originalAnswers = { q1: "A" };
      const attempt = QuizAttempt.reconstitute(
        createValidProps({ answers: originalAnswers })
      );

      const plain = attempt.toPlain();
      plain.answers.q1 = "X"; // Modify the returned copy

      expect(attempt.answers.q1).toBe("A"); // Original should be unchanged
    });
  });
});
