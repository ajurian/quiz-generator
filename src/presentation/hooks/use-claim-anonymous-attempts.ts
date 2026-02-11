import React from "react";
import { claimAnonymousAttempts } from "@/presentation/server-functions";
import {
  getAnonymousAttemptIds,
  clearAnonymousAttempts,
} from "./use-local-answer-storage";

/**
 * Hook that automatically claims anonymous quiz attempts when a user is authenticated.
 *
 * Place this in a top-level layout component. It runs once when it detects
 * both a userId and pending anonymous attempts in localStorage.
 */
export function useClaimAnonymousAttempts(userId: string | null): void {
  const hasRun = React.useRef(false);

  React.useEffect(() => {
    if (!userId || hasRun.current) return;

    const attemptIds = getAnonymousAttemptIds();
    if (attemptIds.length === 0) return;

    hasRun.current = true;

    claimAnonymousAttempts({
      data: { userId, attemptIds },
    })
      .then((result) => {
        if (result.claimedCount > 0) {
          clearAnonymousAttempts();
          console.log(
            `Claimed ${result.claimedCount} anonymous attempt(s) for user`,
          );
        } else {
          // Attempts may have already been claimed or expired — clean up anyway
          clearAnonymousAttempts();
        }
      })
      .catch((error) => {
        console.error("Failed to claim anonymous attempts:", error);
        // Don't clear localStorage on error — retry next time
      });
  }, [userId]);
}
