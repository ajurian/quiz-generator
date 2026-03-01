import { describe, expect, it, beforeEach, mock } from "bun:test";
import { DrizzleAttemptRepository } from "../../infrastructure/database/repositories/drizzle-attempt.repository";
import { AttemptStatus, QuizAttempt } from "@/domain";
import type { DrizzleDatabase } from "../../infrastructure/database/connection";

describe("DrizzleAttemptRepository", () => {
  let repository: DrizzleAttemptRepository;
  let mockDb: DrizzleDatabase;

  const ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const QUIZ_ID = "019b2194-72a0-7001-a712-5e5bc5c31311";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const QUESTION_ID_1 = "019b2194-72a0-7002-a712-5e5bc5c31312";
  const QUESTION_ID_2 = "019b2194-72a0-7003-a712-5e5bc5c31313";

  const createAttempt = (
    overrides: Partial<{
      status: AttemptStatus;
      startedAt: Date;
      answers: Record<string, string>;
    }> = {},
  ): QuizAttempt => {
    return QuizAttempt.reconstitute({
      id: ATTEMPT_ID,
      slug: "test-attempt-slug",
      quizId: QUIZ_ID,
      userId: USER_ID,
      status: overrides.status ?? AttemptStatus.IN_PROGRESS,
      score: null,
      durationMs: null,
      startedAt: overrides.startedAt ?? new Date("2026-01-01T10:00:00.000Z"),
      submittedAt: null,
      answers: overrides.answers ?? {
        [QUESTION_ID_1]: "A",
        [QUESTION_ID_2]: "B",
      },
      parentAttemptId: null,
      lockedQuestionIds: [],
    });
  };

  const createDbRow = (attempt: QuizAttempt) => ({
    id: attempt.id,
    slug: attempt.slug,
    quizId: attempt.quizId,
    userId: attempt.userId,
    status: attempt.status,
    score: attempt.score,
    durationMs: attempt.durationMs,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    parentAttemptId: attempt.parentAttemptId,
    lockedQuestionIds: attempt.lockedQuestionIds,
  });

  beforeEach(() => {
    mockDb = {} as DrizzleDatabase;
    repository = new DrizzleAttemptRepository(mockDb);
  });

  describe("update", () => {
    it("should delete existing answer rows when attempt answers are empty", async () => {
      const attempt = createAttempt({ answers: {} });
      const dbRow = createDbRow(attempt);

      const setMock = mock(() => ({
        where: mock(() => ({
          returning: mock(() => Promise.resolve([dbRow])),
        })),
      }));
      mockDb.update = mock(
        () => ({ set: setMock }) as unknown,
      ) as unknown as DrizzleDatabase["update"];

      const deleteWhereMock = mock(() => Promise.resolve());
      mockDb.delete = mock(
        () => ({ where: deleteWhereMock }) as unknown,
      ) as unknown as DrizzleDatabase["delete"];

      const insertMock = mock(() => ({}));
      mockDb.insert = insertMock as unknown as DrizzleDatabase["insert"];

      const result = await repository.update(attempt);

      expect(result.answers).toEqual({});
      expect(mockDb.delete).toHaveBeenCalledTimes(1);
      expect(deleteWhereMock).toHaveBeenCalledTimes(1);
      expect(insertMock).not.toHaveBeenCalled();
    });

    it("should persist startedAt and replace answer rows for non-empty answers", async () => {
      const startedAt = new Date("2026-02-14T12:30:00.000Z");
      const attempt = createAttempt({
        startedAt,
        answers: { [QUESTION_ID_1]: "D" },
      });
      const dbRow = createDbRow(attempt);

      let capturedSetData: Record<string, unknown> | undefined;
      const setMock = mock((data: Record<string, unknown>) => {
        capturedSetData = data;
        return {
          where: mock(() => ({
            returning: mock(() => Promise.resolve([dbRow])),
          })),
        };
      });
      mockDb.update = mock(
        () => ({ set: setMock }) as unknown,
      ) as unknown as DrizzleDatabase["update"];

      const deleteWhereMock = mock(() => Promise.resolve());
      mockDb.delete = mock(
        () => ({ where: deleteWhereMock }) as unknown,
      ) as unknown as DrizzleDatabase["delete"];

      let capturedInsertValues:
        | Array<{ quizAttemptId: string; questionId: string; answer: string }>
        | undefined;
      const onConflictDoUpdateMock = mock(() => Promise.resolve());
      const valuesMock = mock(
        (
          values: Array<{
            quizAttemptId: string;
            questionId: string;
            answer: string;
          }>,
        ) => {
          capturedInsertValues = values;
          return { onConflictDoUpdate: onConflictDoUpdateMock };
        },
      );
      const insertMock = mock(() => ({ values: valuesMock }));
      mockDb.insert = insertMock as unknown as DrizzleDatabase["insert"];

      const result = await repository.update(attempt);

      expect(result.answers).toEqual({ [QUESTION_ID_1]: "D" });
      expect(mockDb.delete).toHaveBeenCalledTimes(1);
      expect(deleteWhereMock).toHaveBeenCalledTimes(1);
      expect(insertMock).toHaveBeenCalledTimes(1);
      expect(capturedInsertValues).toEqual([
        {
          quizAttemptId: ATTEMPT_ID,
          questionId: QUESTION_ID_1,
          answer: "D",
        },
      ]);
      expect(onConflictDoUpdateMock).toHaveBeenCalledTimes(1);
      expect(capturedSetData?.startedAt).toEqual(startedAt);
    });
  });
});
