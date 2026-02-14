import type {
  IAttemptRepository,
  IQuestionRepository,
  IQuizRepository,
  IIdGenerator,
} from "../../ports";
import { toAttemptResponseDTO, type AttemptResponseDTO } from "../../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";
import { QuizAttempt, AttemptStatus } from "@/domain";

/**
 * Input for RetakeAttemptUseCase
 */
export interface RetakeAttemptInput {
  /** The ID of the submitted attempt to retake from */
  sourceAttemptId: string;
  /** Quiz slug for access check */
  quizSlug: string;
  /** Current user ID (null for anonymous) */
  userId: string | null;
}

/**
 * Output for RetakeAttemptUseCase
 */
export interface RetakeAttemptOutput {
  attempt: AttemptResponseDTO;
}

/**
 * Dependencies for RetakeAttemptUseCase
 */
export interface RetakeAttemptUseCaseDeps {
  attemptRepository: IAttemptRepository;
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
  idGenerator: IIdGenerator;
}

/**
 * Use case for retaking a quiz from an existing submitted attempt.
 *
 * Creates a new IN_PROGRESS attempt pre-populated with the correct answers
 * from the source attempt, leaving wrong/unanswered questions empty.
 * The user then only needs to re-answer the questions they got wrong.
 *
 * Correct answers are locked and cannot be modified during the retake.
 * Score is calculated across all questions (pre-filled correct ones count).
 */
export class RetakeAttemptUseCase {
  constructor(private readonly deps: RetakeAttemptUseCaseDeps) {}

  async execute(input: RetakeAttemptInput): Promise<RetakeAttemptOutput> {
    // 1. Validate input
    if (!input.sourceAttemptId || typeof input.sourceAttemptId !== "string") {
      throw new ValidationError("Source attempt ID is required", {
        sourceAttemptId: ["Source attempt ID is required"],
      });
    }

    if (!input.quizSlug || typeof input.quizSlug !== "string") {
      throw new ValidationError("Quiz slug is required", {
        quizSlug: ["Quiz slug is required"],
      });
    }

    // 2. Find source attempt - must exist and be SUBMITTED
    const sourceAttempt = await this.deps.attemptRepository.findById(
      input.sourceAttemptId,
    );
    if (!sourceAttempt) {
      throw new NotFoundError("Attempt", input.sourceAttemptId);
    }

    if (sourceAttempt.status !== AttemptStatus.SUBMITTED) {
      throw new ForbiddenError("Can only retake from a submitted attempt");
    }

    // 3. Find quiz - must exist and be accessible
    const quiz = await this.deps.quizRepository.findBySlug(input.quizSlug);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizSlug);
    }

    if (!quiz.canBeAccessedBy(input.userId)) {
      throw new NotFoundError("Quiz", input.quizSlug);
    }

    // 4. Verify source attempt belongs to this quiz
    if (sourceAttempt.quizId !== quiz.id) {
      throw new ValidationError("Source attempt does not belong to this quiz", {
        sourceAttemptId: ["Source attempt does not belong to this quiz"],
      });
    }

    // 5. Verify ownership - user must own the source attempt
    // For anonymous attempts (userId is null on both sides), allow retake
    if (input.userId !== null && !sourceAttempt.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You can only retake your own attempts");
    }

    // 6. Fetch questions for the quiz
    const questions = await this.deps.questionRepository.findByQuizId(quiz.id);

    // 7. Build filtered answers: keep only correct answers from source
    const correctAnswers: Record<string, string> = {};
    const lockedQuestionIds: string[] = [];

    const sourceAnswers = sourceAttempt.answers;

    for (const question of questions) {
      const sourceAnswer = sourceAnswers[question.id];
      if (sourceAnswer && question.isAnswerCorrect(sourceAnswer)) {
        correctAnswers[question.id] = sourceAnswer;
        lockedQuestionIds.push(question.id);
      }
      // Wrong or unanswered questions are left empty — user must re-answer them
    }

    // 8. Create new attempt with pre-filled correct answers
    const attemptId = this.deps.idGenerator.generate();
    const attempt = QuizAttempt.create({
      id: attemptId,
      quizId: quiz.id,
      userId: input.userId,
      answers: correctAnswers,
      parentAttemptId: sourceAttempt.id,
      lockedQuestionIds,
    });

    // 9. Persist and return
    const savedAttempt = await this.deps.attemptRepository.create(attempt);

    return {
      attempt: toAttemptResponseDTO(savedAttempt.toPlain()),
    };
  }
}
