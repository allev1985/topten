import { getSession } from "@/lib/auth";

/**
 * Shared auth guard for Server Actions.
 *
 * Returns `{ userId, email }` when a valid session exists, or `{ error }` when
 * the user is not authenticated. Callers should bail out immediately on the
 * error branch:
 *
 * ```ts
 * const auth = await requireAuth();
 * if ("error" in auth) {
 *   return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
 * }
 * ```
 */
export async function requireAuth(): Promise<
  { userId: string; email: string | undefined } | { error: string }
> {
  const session = await getSession();
  if (!session.authenticated || !session.user?.id) {
    return { error: "You must be logged in to perform this action" };
  }
  return { userId: session.user.id, email: session.user.email ?? undefined };
}
