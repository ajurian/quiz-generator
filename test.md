## Overview
This spec defines the interaction rules for quiz cards under the **Created** section in the dashboard.
Cards should act as “snapshot” containers that encourage clicking into details, while still supporting a small number of secondary actions.

## Goals
- Make each Created card clearly clickable to open the quiz manage page.
- Keep a clean action hierarchy: one primary action, one secondary action.
- Avoid nested-interactive and click-conflict issues (CTA clicks must not trigger card navigation).

## Routes
- Manage quiz: `/quiz/m/{quiz_slug}`
- Take quiz (attempt): `/quiz/a/{quiz_slug}`
- Create quiz: `/quiz/new`

## Card behavior (Created section)
### Primary navigation
- Clicking the card container (excluding CTA areas) navigates to: `/quiz/m/{quiz_slug}`.
- The card MUST show clear clickability signifiers:
  - Hover style on card (border/raise/shadow change).
  - Visible keyboard focus indicator when tabbed.

### CTAs (inside card)
Cards may contain secondary clickable elements in addition to the main card click target.
Add these CTAs:

- Primary CTA: **Take**
  - Action: navigate to `/quiz/a/{quiz_slug}`
- Secondary CTA: **Share**
  - Action: open a dialog (modal) for visibility + link copy

### Interaction safety rules (required)
- Clicking **Take** or **Share** must NOT also trigger the card navigation.
- Do NOT wrap the entire card in a single `<a>` if it contains buttons/links; implement as separate interactive regions that meet accessibility expectations.

## Share dialog requirements
The Share dialog should allow:
- Updating quiz visibility: `private | unlisted | public`
- Copying the share link (based on current visibility)

UI/UX principles:
- Use clear labels and short helper text (signifiers + clarity).
- Provide immediate feedback on actions (e.g., “Copied” toast, “Visibility updated”).
- Keep the dialog minimal: one primary action per row, avoid clutter.

Implementation note:
- Reuse logic from `visibility-settings-card.tsx`, but render it inside a modal UI.

## Removals / cleanup
- Remove CTA “View” from Created cards.
- Remove the page: `dashboard/quiz/{id}`
- Remove the page: `/quiz/{id}/public`
- Move quiz creation page from `dashboard/quiz/new` to `/quiz/new`

## Acceptance criteria
- Card click navigates to `/quiz/m/{quiz_slug}` and is visually recognizable as clickable.
- The card contains **Take** and **Share** CTAs, and CTA clicks do not trigger card navigation.
- Share dialog supports visibility change and link copy with clear feedback.
- Deprecated routes/pages are removed and no longer referenced anywhere in the UI.
