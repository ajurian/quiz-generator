/**
 * Presentation Features
 *
 * Feature modules encapsulate business logic adapters for the presentation layer.
 * Routes and server-functions delegate to these modules to keep themselves thin.
 *
 * Each feature module:
 * - May call composition.ts to access the container
 * - Orchestrates multi-step operations
 * - Returns Application DTOs directly (no separate ViewModels)
 */

export * from "./quiz-generation";
export * from "./quiz-events";
