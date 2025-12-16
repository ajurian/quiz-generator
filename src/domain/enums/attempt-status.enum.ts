/**
 * Attempt Status Enum
 *
 * Defines the status of a quiz attempt:
 * - IN_PROGRESS: User has started but not submitted the attempt
 * - SUBMITTED: User has completed and submitted the attempt
 */
export enum AttemptStatus {
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
}

/**
 * Type guard to check if a value is a valid AttemptStatus
 */
export function isAttemptStatus(value: unknown): value is AttemptStatus {
  return (
    typeof value === "string" &&
    Object.values(AttemptStatus).includes(value as AttemptStatus)
  );
}

/**
 * Get display name for an AttemptStatus value
 */
export function getAttemptStatusDisplayName(status: AttemptStatus): string {
  const displayNames: Record<AttemptStatus, string> = {
    [AttemptStatus.IN_PROGRESS]: "In Progress",
    [AttemptStatus.SUBMITTED]: "Submitted",
  };
  return displayNames[status];
}
