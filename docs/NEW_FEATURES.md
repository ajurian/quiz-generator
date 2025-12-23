You are implementing quiz visibility, identifiers, routes, and UX for an AI‑generated quiz app. Build exactly as specified below and do not introduce manual question authoring.

- Goal
    - Replace isPublic with visibility enum and introduce stable, non‑guessable slugs for quizzes and attempts.
    - Align routes with clear roles: answer (attempt), history (list/detail), and creator management.
- Visibility model
    - Quiz.visibility: enum = private | unlisted | public.
    - Access rules:
        - private: Only owner can view/attempt.
        - unlisted: Anyone with the link can view/attempt; not listed in public directories.
        - public: Discoverable in app directories; anyone can view/attempt.
- Identifiers and slugs
    - Quiz.id: UUID (v7); Quiz.slug: base64url of raw 16‑byte UUID (no padding, URL‑safe, deterministic).
    - Attempt.id: UUID v7; Attempt.slug: base64url derived from Attempt.id.
    - Persist both id and slug; add unique index on slug in each table. Never regenerate slugs.
    - base64url
- Entities (new/updated)
    - quiz { id, ownerId, visibility, slug, createdAt, updatedAt, … }
    - quiz_attempt { id, slug, quizId, userId, status: in_progress|submitted, score, durationMs, startedAt, submittedAt, mode: preview|normal, … }
    - Optional: quiz_version snapshotting for publish workflows (future‑proofing), but not required for this task.
- Routes (stable contracts)
    - Answer: /quiz/a/{quiz_slug} → starts attempt flow or shows “already completed” screen (see UX below).
    - History (list): /quiz/h/{quiz_slug} → user’s attempt list for that quiz.
    - History (detail): /quiz/h/{quiz_slug}/{attempt_slug} → review a specific attempt.
    - Creator manage: /quiz/m/{quiz_slug} → visibility controls, share link, correct answers/rationales preview, creator actions.
    - Behavior with visibility:
        - Enforce access rules on all routes server‑side; return 404/403 appropriately without leaking existence.
- Attempt UX on /quiz/a/{quiz_slug}
    - If 0 attempts by current user: start a new attempt immediately (normal mode).
    - If greater than or equal to 1 attempts by current user: show “You already completed this quiz” with last attempt summary (score, date, time spent) and three CTAs:
        - “View all attempts” → /quiz/h/{quiz_slug}
        - “Review last attempt” → /quiz/h/{quiz_slug}/{last_attempt_slug}
        - “Try again” → starts a new attempt immediately (bypass the same prompt next time once they click).
    - Record multiple attempts per user; each submit creates a new quiz_attempt with status=submitted.
- Creator behaviors
    - Creators may take their own quiz in:
        - Preview mode (not recorded or recorded with mode=preview and excluded from stats).
        - Real attempt (mode=normal; included in their history).
    - On /quiz/m/{quiz_slug} expose:
        - Visibility selector: private/unlisted/public (persist immediately).
        - Share link copy (uses the answer URL /quiz/a/{quiz_slug} for unlisted/public).
        - Correct answers/rationales view (read‑only preview).
        - Buttons: Primary “Take” (starts /quiz/a/{quiz_slug} as real attempt), Secondary “Share”.
- Dashboard sections and card CTAs
    - “Created”: quizzes where ownerId = current user.
        - Card click → /quiz/m/{quiz_slug}.
        - Primary CTA: “Take” (real attempt), Secondary CTA: “Share”.
    - “Taken”: quizzes the user has attempted (including their own).
        - Card click → /quiz/h/{quiz_slug}.
        - Primary CTA: “Try Again” → /quiz/a/{quiz_slug} (immediately starts a new attempt).
    - Ensure card CTAs do not trigger the card’s primary navigation (separate clickable regions).
- Validation and constraints
    - Uniqueness: quiz.slug UNIQUE, attempt.slug UNIQUE. Add indexes on quiz.slug and attempt.quizId,userId,submittedAt DESC for history.
    - Authorization: every route must re‑check visibility and ownership; do not rely on client.
    - Redirection: if a non‑owner hits /quiz/m/{quiz_slug} return 404/403 (no existence leak); if an unauthorized user hits answer/history, show access‑denied state.
- Copy and micro‑UX
    - “You already completed this quiz” headline, with subtext: “Last attempt on {date}, {duration}.”
    - Buttons order: Primary on the right (Try again/Retake), secondary to the left (Review last / View all attempts).
    - When visibility changes to public, show a brief toast with the public directory hint; when unlisted, show “Anyone with the link can access.”
- Non‑functional
    - Slugs must be URL‑safe and case‑sensitive as generated.
    - Log all access‑denied events with anonymized context (no PII in logs).
    - Return consistent HTTP semantics: 403 when the quiz exists but user lacks permission (for authenticated users); 404 for anonymous on private.
- Acceptance criteria
    - Given a quiz with visibility=unlisted, a signed‑out user can open /quiz/a/{quiz_slug} and complete an attempt; history becomes available after sign‑in.
    - Given greater than or equal to 1 prior attempts, /quiz/a/{quiz_slug} shows last attempt summary with the three CTAs and “Try again” creates a new submitted attempt on completion.
    - Given a creator, clicking a “Created” card opens /quiz/m/{quiz_slug} and allows visibility change and link copy; “Take” starts a real attempt.
    - Slugs are deterministic base64url encodings of UUIDs; unique constraints prevent duplicates; attempts use UUID v7 and have independent slugs.


## Rationale highlights

- Using visibility enums clarifies rules and avoids boolean drift; base64url slugs provide compact, non‑guessable, URL‑safe identifiers derived from UUIDs.
- Clear route affordances keep answering (/a), history (/h), and creator management (/m) distinct, simplifying authorization and navigation.
- The “already completed” interstitial avoids accidental duplicate attempts while keeping a one‑click “Try again” for speed.


## Implementation notes

- Add helper: uuid_to_base64url(uuid_bytes) and base64url_to_uuid for debugging; remove padding and use URL‑safe alphabet.
- Add DB constraints and indexes now to avoid painful migrations later; make slug the external ID in URLs and keep UUIDs internal for joins.
- Ensure server‑side checks mirror UI rules; never trust client state when deciding access, visibility, or attempt creation.

