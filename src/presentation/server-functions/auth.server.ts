import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getAuth } from "@/infrastructure/auth";

/**
 * Server function to get current session
 * This is used to check auth status on the server
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session;
  }
);

/**
 * Export type for session data
 */
export type ServerSession = Awaited<ReturnType<typeof getServerSession>>;
