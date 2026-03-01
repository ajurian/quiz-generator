import React from "react";
import { autosaveAnswer, removeAnswer } from "@/presentation/server-functions";
import { useLocalAnswerStorage } from "./use-local-answer-storage";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AnswerPersistence {
  saveStatus: SaveStatus;
  saveAnswer: (questionId: string, optionIndex: string) => Promise<void>;
  removeAnswer: (questionId: string) => Promise<void>;
  /** Clear locally stored answers (no-op for authenticated users). */
  clearAnswers: () => void;
  /** Whether answers are stored locally (anonymous) vs server (authenticated). */
  isLocal: boolean;
}

/**
 * Hook for saving answer to the server when user checks it.
 * Used for authenticated users.
 */
function useServerSaveAnswer(
  attemptId: string,
  userId: string,
): Pick<AnswerPersistence, "saveStatus" | "saveAnswer" | "removeAnswer"> {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAnswer = React.useCallback(
    async (questionId: string, optionIndex: string) => {
      setSaveStatus("saving");
      try {
        await autosaveAnswer({
          data: {
            attemptId,
            userId,
            questionId,
            optionIndex,
          },
        });
        setSaveStatus("saved");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus("error");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
        throw error;
      }
    },
    [attemptId, userId],
  );

  const removeSavedAnswer = React.useCallback(
    async (questionId: string) => {
      setSaveStatus("saving");
      try {
        await removeAnswer({
          data: {
            attemptId,
            userId,
            questionId,
          },
        });
        setSaveStatus("saved");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (error) {
        console.error("Remove failed:", error);
        setSaveStatus("error");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
        throw error;
      }
    },
    [attemptId, userId],
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { saveStatus, saveAnswer, removeAnswer: removeSavedAnswer };
}

/**
 * Unified hook that delegates answer persistence to either:
 * - Server (autosaveAnswer) for authenticated users
 * - localStorage for unauthenticated users
 *
 * Returns a consistent interface regardless of storage strategy.
 *
 * @param attemptId - The current attempt ID
 * @param userId - The authenticated user ID, or null for anonymous
 * @param quizSlug - The quiz slug (used as localStorage key for anonymous)
 */
export function useAnswerPersistence(
  attemptId: string,
  userId: string | null,
  quizSlug: string,
): AnswerPersistence {
  const isLocal = userId === null;

  // Always call both hooks (React rules of hooks), but only use the relevant one
  const serverHook = useServerSaveAnswer(attemptId, userId ?? "__unused__");
  const localHook = useLocalAnswerStorage(quizSlug);

  if (isLocal) {
    return {
      saveStatus: localHook.saveStatus,
      saveAnswer: localHook.saveAnswer,
      removeAnswer: localHook.removeAnswer,
      clearAnswers: localHook.clearAnswers,
      isLocal: true,
    };
  }

  return {
    saveStatus: serverHook.saveStatus,
    saveAnswer: serverHook.saveAnswer,
    removeAnswer: serverHook.removeAnswer,
    clearAnswers: () => {}, // No-op for authenticated users
    isLocal: false,
  };
}
