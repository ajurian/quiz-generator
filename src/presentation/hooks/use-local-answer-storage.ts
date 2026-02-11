import React from "react";

/**
 * localStorage key prefix for anonymous quiz answers.
 * Keyed by quiz slug (stable across page reloads, unlike attemptId which changes each time for anonymous users).
 */
const STORAGE_PREFIX = "quiz-answers";

/**
 * Max age for stored answers (24 hours in milliseconds).
 * Entries older than this are discarded on read to prevent indefinite accumulation.
 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface StoredAnswerData {
  answers: Record<string, string>;
  checkedQuestions: string[];
  lastUpdated: number;
}

function getStorageKey(quizSlug: string): string {
  return `${STORAGE_PREFIX}:${quizSlug}`;
}

/**
 * Read stored answer data from localStorage.
 * Returns null if not found, expired, or on parse error.
 */
function readStoredData(quizSlug: string): StoredAnswerData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(quizSlug));
    if (!raw) return null;

    const data: StoredAnswerData = JSON.parse(raw);

    // Discard if older than MAX_AGE_MS
    if (Date.now() - data.lastUpdated > MAX_AGE_MS) {
      localStorage.removeItem(getStorageKey(quizSlug));
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Write answer data to localStorage.
 */
function writeStoredData(quizSlug: string, data: StoredAnswerData): void {
  try {
    localStorage.setItem(getStorageKey(quizSlug), JSON.stringify(data));
  } catch (error) {
    // Quota exceeded or private browsing restriction
    console.warn("Failed to write to localStorage:", error);
  }
}

/**
 * Hook for persisting quiz answers to localStorage for unauthenticated users.
 *
 * Uses the quiz slug as the stable storage key (since anonymous users get a
 * new attemptId on every page load).
 *
 * @param quizSlug - The quiz slug to use as a storage key
 */
export function useLocalAnswerStorage(quizSlug: string) {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Save a single answer to localStorage (async signature for API compatibility with server save).
   */
  const saveAnswer = React.useCallback(
    async (questionId: string, optionIndex: string): Promise<void> => {
      setSaveStatus("saving");
      try {
        const existing = readStoredData(quizSlug);
        const data: StoredAnswerData = {
          answers: { ...(existing?.answers ?? {}), [questionId]: optionIndex },
          checkedQuestions: existing?.checkedQuestions ?? [],
          lastUpdated: Date.now(),
        };

        // Add to checkedQuestions if not already present
        if (!data.checkedQuestions.includes(questionId)) {
          data.checkedQuestions.push(questionId);
        }

        writeStoredData(quizSlug, data);
        setSaveStatus("saved");

        // Reset to idle after showing "saved" state
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (error) {
        console.error("Local save failed:", error);
        setSaveStatus("error");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
        throw error;
      }
    },
    [quizSlug],
  );

  /**
   * Get all saved answers from localStorage.
   */
  const getAnswers = React.useCallback((): Record<string, string> => {
    const data = readStoredData(quizSlug);
    return data?.answers ?? {};
  }, [quizSlug]);

  /**
   * Get the list of checked (locked) question IDs from localStorage.
   */
  const getCheckedQuestions = React.useCallback((): string[] => {
    const data = readStoredData(quizSlug);
    return data?.checkedQuestions ?? [];
  }, [quizSlug]);

  /**
   * Clear all saved answers for this quiz (call after successful submit).
   */
  const clearAnswers = React.useCallback((): void => {
    try {
      localStorage.removeItem(getStorageKey(quizSlug));
    } catch {
      // Ignore cleanup errors
    }
  }, [quizSlug]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    saveStatus,
    saveAnswer,
    getAnswers,
    getCheckedQuestions,
    clearAnswers,
  };
}

/**
 * Read locally stored answers for a quiz slug (non-hook utility).
 * Useful in route components before hooks are available.
 */
export function getLocalAnswers(
  quizSlug: string,
): { answers: Record<string, string>; checkedQuestions: string[] } | null {
  const data = readStoredData(quizSlug);
  if (!data) return null;
  return { answers: data.answers, checkedQuestions: data.checkedQuestions };
}
