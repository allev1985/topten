/**
 * Session validation utilities
 *
 * Lightweight helpers for working with BetterAuth session data.
 * These are pure functions with no side effects — safe to call from
 * any server context.
 */

import type { SessionInfo } from "@/lib/auth/types";
import { config } from "@/lib/config/client";

export interface BetterAuthSession {
  user: { id: string; email: string; name: string };
  session: { expiresAt: Date | string };
}

/**
 * Extract session info from a BetterAuth session object.
 */
export function getSessionInfo(session: BetterAuthSession | null): SessionInfo {
  if (!session) {
    return {
      isValid: false,
      user: null,
      expiresAt: null,
      isExpiringSoon: false,
    };
  }

  const expiresAt =
    session.session.expiresAt instanceof Date
      ? session.session.expiresAt
      : new Date(session.session.expiresAt);

  return {
    isValid: true,
    user: { id: session.user.id, email: session.user.email },
    expiresAt,
    isExpiringSoon: isSessionExpiringSoon(expiresAt),
  };
}

/**
 * Check if the session expires within the configured threshold.
 */
export function isSessionExpiringSoon(
  expiresAt: Date,
  thresholdMs: number = config.auth.sessionExpiryThresholdMs
): boolean {
  const remaining = expiresAt.getTime() - Date.now();
  return remaining > 0 && remaining <= thresholdMs;
}
