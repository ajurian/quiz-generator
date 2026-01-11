/**
 * Quiz Generation Orchestrator
 *
 * This module centralizes all quiz generation workflow logic.
 * Both the direct execution path (development) and workflow-based path
 * should call through here to ensure consistent behavior.
 *
 * Responsibilities:
 * - Coordinate the multi-step quiz generation process
 * - Manage error handling and cleanup
 * - Publish progress/completion events
 *
 * This is an "interface adapter" in Clean Architecture terms - it adapts
 * between presentation needs and application/domain services.
 */

import {
  Quiz,
  SourceMaterial,
  Question,
  QuizStatus,
  QuizGenerationEvents,
  type QuestionPreview,
} from "@/domain";
import { ValidationError, QuotaExceededError } from "@/application";
import {
  QuizGenerationPolicy,
  type GeneratedQuestionData,
} from "@/application";
import { getContainer } from "@/presentation/lib/composition";

import type {
  QuizGenerationInput,
  QuizGenerationResult,
  QuizData,
  SourceMaterialData,
  UploadedFileMetadata,
} from "./types";

// Re-export types for convenience
export type { QuizGenerationInput, QuizGenerationResult, QuizData };

/**
 * Creates a quiz record with GENERATING status.
 * This is the first step that creates the quiz in the database
 * so it appears in the user's dashboard immediately.
 */
export async function createQuizRecord(
  input: QuizGenerationInput
): Promise<QuizData> {
  const container = getContainer();
  const { userId, title, distribution, visibility } = input;

  // Validate at least one question type
  const totalQuestions =
    distribution.directQuestion +
    distribution.twoStatementCompound +
    distribution.contextual;

  if (totalQuestions === 0) {
    throw new ValidationError("At least one question is required", {
      distribution: ["At least one question type must have a count > 0"],
    });
  }

  // Generate quiz ID and create Quiz entity
  const quizId = container.services.idGenerator.generate();
  const quiz = Quiz.create({
    id: quizId,
    userId,
    title: title.trim(),
    distribution,
    visibility,
    status: QuizStatus.GENERATING,
  });

  // Persist quiz to database
  await container.repositories.quizRepository.create(quiz);

  return {
    id: quiz.id,
    userId: quiz.userId,
    slug: quiz.slug,
    title: quiz.title,
    distribution: quiz.distribution,
    visibility: quiz.visibility,
    status: quiz.status,
  };
}

/**
 * Continues quiz generation after the quiz record has been created.
 * This handles the heavy lifting: file processing, AI generation, persistence.
 *
 * Use this for fire-and-forget execution after createQuizRecord.
 */
export async function continueQuizGeneration(
  quizData: QuizData,
  input: QuizGenerationInput
): Promise<QuizGenerationResult> {
  const container = getContainer();

  try {
    // Step 2: Create source material records
    console.log("[QuizGeneration] Step 2: Creating source materials...");
    const sourceMaterialsData = await createSourceMaterials(
      quizData,
      input.files
    );

    // Step 3: Fetch files from S3 and upload to Gemini
    console.log("[QuizGeneration] Step 3: Uploading files to Gemini...");
    const uploadedFiles = await uploadFilesToGemini(sourceMaterialsData);

    // Step 4: Generate questions using AI
    console.log("[QuizGeneration] Step 4: Generating questions...");
    const generatedQuestions = await generateQuestions(quizData, uploadedFiles);

    // Step 5: Persist questions to database
    console.log("[QuizGeneration] Step 5: Persisting questions...");
    await persistQuestions(quizData.id, generatedQuestions);

    // Step 6: Update quiz status to READY
    console.log("[QuizGeneration] Step 6: Updating quiz status...");
    await updateQuizStatus(quizData.id);

    // Step 7: Publish completion event
    console.log("[QuizGeneration] Step 7: Publishing completion event...");
    await publishCompletionEvent(quizData);

    // Step 8: Cleanup Gemini files (best effort)
    console.log("[QuizGeneration] Step 8: Cleaning up Gemini files...");
    await cleanupGeminiFiles(uploadedFiles);

    console.log("[QuizGeneration] Quiz generation completed successfully!");

    return {
      quizSlug: quizData.slug,
      quizId: quizData.id,
      questionCount: generatedQuestions.length,
    };
  } catch (error) {
    // Handle failure - update quiz status
    await handleGenerationFailure(quizData, error);
    throw error;
  }
}

/**
 * Executes the full quiz generation workflow directly (synchronously).
 * Use this for development/testing when Upstash Workflow is not available.
 */
export async function executeQuizGenerationDirect(
  input: QuizGenerationInput
): Promise<QuizGenerationResult> {
  let quizData: QuizData | null = null;

  try {
    // Step 1: Create quiz record
    console.log("[QuizGeneration] Step 1: Creating quiz record...");
    quizData = await createQuizRecord(input);

    // Continue with the rest of the generation
    return await continueQuizGeneration(quizData, input);
  } catch (error) {
    // If we created a quiz but failed later, the error is already handled
    // in continueQuizGeneration. If we failed before creating, just rethrow.
    if (!quizData) {
      throw error;
    }
    // Error already handled in continueQuizGeneration
    throw error;
  }
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

async function createSourceMaterials(
  quizData: QuizData,
  files: QuizGenerationInput["files"]
): Promise<SourceMaterialData[]> {
  const container = getContainer();

  const sourceMaterials = files.map((file, index) =>
    SourceMaterial.create({
      id: container.services.idGenerator.generate(),
      quizId: quizData.id,
      title: file.filename,
      fileKey: file.key,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      quizReferenceIndex: index,
    })
  );

  await container.repositories.sourceMaterialRepository.createBulk(
    sourceMaterials
  );

  return sourceMaterials.map((sm) => ({
    id: sm.id,
    quizId: sm.quizId,
    title: sm.title,
    fileKey: sm.fileKey,
    mimeType: sm.mimeType,
    sizeBytes: sm.sizeBytes,
    quizReferenceIndex: sm.quizReferenceIndex,
  }));
}

async function uploadFilesToGemini(
  sourceMaterialsData: SourceMaterialData[]
): Promise<UploadedFileMetadata[]> {
  const container = getContainer();
  const files: File[] = [];

  // Fetch files from S3
  for (const material of sourceMaterialsData) {
    const { content, contentType } =
      await container.services.s3Storage.getObject(material.fileKey);

    // Convert Uint8Array to File
    const arrayBuffer = content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: contentType });
    const file = new File([blob], material.title, { type: contentType });
    files.push(file);
  }

  // Upload to Gemini Files API
  const fileMetadata = await container.services.fileStorage.uploadFiles(files);

  return fileMetadata.map(
    (f: {
      id: string;
      name: string;
      mimeType: string;
      uri: string;
      sizeBytes: number;
    }) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      uri: f.uri,
      sizeBytes: f.sizeBytes,
    })
  );
}

async function generateQuestions(
  quizData: QuizData,
  uploadedFiles: UploadedFileMetadata[]
): Promise<GeneratedQuestionData[]> {
  const container = getContainer();
  const policy = QuizGenerationPolicy.forStreaming();

  const totalQuestions =
    quizData.distribution.directQuestion +
    quizData.distribution.twoStatementCompound +
    quizData.distribution.contextual;

  const onProgress = async (progress: {
    questionsGenerated: number;
    questions: QuestionPreview[];
  }) => {
    // Publish progress event via Redis
    await container.services.eventPublisher.publish(
      QuizGenerationEvents.processing({
        quizId: quizData.id,
        quizSlug: quizData.slug,
        userId: quizData.userId,
        questionsGenerated: progress.questionsGenerated,
        totalQuestions,
        questions: progress.questions,
      })
    );
  };

  try {
    const result = await policy.executeWithFallback((model) =>
      container.services.aiGenerator.generateQuestionsStream({
        files: uploadedFiles,
        distribution: quizData.distribution,
        model,
        onProgress,
      })
    );
    return result.data as GeneratedQuestionData[];
  } catch (error) {
    if (policy.isQuotaError(error)) {
      throw new QuotaExceededError("AI Quiz Generator");
    }
    throw error;
  }
}

async function persistQuestions(
  quizId: string,
  generatedQuestions: GeneratedQuestionData[]
): Promise<void> {
  const container = getContainer();

  const questions = generatedQuestions.map((q, index) =>
    Question.create({
      id: container.services.idGenerator.generate(),
      quizId,
      orderIndex: index,
      type: q.type,
      stem: q.stem,
      options: q.options.map((opt) => ({
        index: opt.index as "A" | "B" | "C" | "D",
        text: opt.text,
        isCorrect: opt.isCorrect,
        errorRationale: opt.errorRationale,
      })),
      correctExplanation: q.correctExplanation,
      sourceQuote: q.sourceQuote,
      reference: q.reference,
    })
  );

  await container.repositories.questionRepository.createBulk(questions);
}

async function updateQuizStatus(quizId: string): Promise<void> {
  const container = getContainer();

  const quiz = await container.repositories.quizRepository.findById(quizId);
  if (quiz) {
    quiz.markAsReady();
    await container.repositories.quizRepository.update(quiz);
  }
}

async function publishCompletionEvent(quizData: QuizData): Promise<void> {
  const container = getContainer();

  await container.services.eventPublisher.publish(
    QuizGenerationEvents.completed({
      quizId: quizData.id,
      quizSlug: quizData.slug,
      userId: quizData.userId,
    })
  );
}

async function cleanupGeminiFiles(
  uploadedFiles: UploadedFileMetadata[]
): Promise<void> {
  const container = getContainer();

  if (uploadedFiles.length > 0) {
    try {
      await container.services.fileStorage.deleteFiles(
        uploadedFiles.map((f) => f.id)
      );
    } catch (error) {
      console.warn("Failed to cleanup Gemini files:", error);
    }
  }
}

async function handleGenerationFailure(
  quizData: QuizData,
  error: unknown
): Promise<void> {
  const container = getContainer();

  try {
    const quiz = await container.repositories.quizRepository.findById(
      quizData.id
    );

    if (quiz && quiz.status === QuizStatus.GENERATING) {
      const errorMessage =
        error instanceof Error ? error.message : "Quiz generation failed";
      quiz.markAsFailed(errorMessage);
      await container.repositories.quizRepository.update(quiz);

      // Publish failure event
      await container.services.eventPublisher.publish(
        QuizGenerationEvents.failed({
          quizId: quizData.id,
          quizSlug: quizData.slug,
          userId: quizData.userId,
          errorMessage,
        })
      );
    }
  } catch (failureError) {
    console.error("Failed to handle quiz generation failure:", failureError);
  }
}
