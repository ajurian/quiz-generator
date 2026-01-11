/**
 * Presentation Composition Accessor
 *
 * This module provides the ONLY gateway for presentation layer to access
 * infrastructure services. All server functions and routes should import
 * from here instead of directly from @/infrastructure.
 *
 * This pattern:
 * - Enforces clean architecture boundaries (presentation doesn't know about infra details)
 * - Makes it easy to swap implementations or add middleware
 * - Provides a clear seam for testing (mock this module)
 * - Keeps infra details out of presentation layer
 */

// This is the ONLY file in presentation that imports from infrastructure
import { getContainer as getInfraContainer } from "@/infrastructure/di";
import type { AppContainer } from "@/infrastructure/di";
import type { UseCases, Services } from "@/infrastructure/di";
import type { Auth } from "@/infrastructure/auth";

/**
 * Gets the application container
 *
 * For Node serverless (Lambda/Vercel), returns a singleton container
 * that persists across warm invocations.
 */
export function getContainer(): AppContainer {
  return getInfraContainer();
}

/**
 * Gets use cases from the container
 *
 * Convenience function for server functions that only need use cases.
 */
export function getUseCases(): UseCases {
  return getContainer().useCases;
}

/**
 * Gets services from the container
 *
 * Convenience function for routes that need direct service access.
 */
export function getServices(): Services {
  return getContainer().services;
}

/**
 * Gets the auth instance from the container
 *
 * Use this for auth route handlers and session checking.
 */
export function getAuth(): Auth {
  return getContainer().auth;
}

// Re-export types for presentation layer convenience
export type { Auth, UseCases, Services, AppContainer };
