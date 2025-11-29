/**
 * Session validation utilities for YourFavs
 * Provides consistent session validation and expiry checks
 *
 * Works on both client and server contexts
 */

import type { Session, User } from "@supabase/supabase-js";

/**
 * Session information for API responses
 */
export interface SessionInfo {
  isValid: boolean;
  user: Pick<User, "id" | "email"> | null;
  expiresAt: Date | null;
  isExpiringSoon: boolean;
}

/**
 * Session expiry threshold (5 minutes in milliseconds)
 * Used to determine when to proactively refresh sessions
 */
export const SESSION_EXPIRY_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Extract session information for API response
 * @param session - Supabase session object or null
 * @returns SessionInfo with validation status and details
 */
export function getSessionInfo(session: Session | null): SessionInfo {
  if (!session) {
    return {
      isValid: false,
      user: null,
      expiresAt: null,
      isExpiringSoon: false,
    };
  }

  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000)
    : null;

  return {
    isValid: true,
    user: session.user
      ? { id: session.user.id, email: session.user.email }
      : null,
    expiresAt,
    isExpiringSoon: isSessionExpiringSoon(session),
  };
}

/**
 * Check if session is expired
 * @param session - Supabase session object or null
 * @returns true if session is null or expired
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session?.expires_at) {
    return true;
  }

  const expiresAtMs = session.expires_at * 1000;
  return Date.now() >= expiresAtMs;
}

/**
 * Get time remaining until session expires (milliseconds)
 * @param session - Supabase session object or null
 * @returns milliseconds until expiration, 0 if expired or null
 */
export function getSessionTimeRemaining(session: Session | null): number {
  if (!session?.expires_at) {
    return 0;
  }

  const expiresAtMs = session.expires_at * 1000;
  const remaining = expiresAtMs - Date.now();

  return Math.max(0, remaining);
}

/**
 * Check if session is expiring within threshold
 * @param session - Supabase session object or null
 * @param thresholdMs - Threshold in milliseconds (default: 5 minutes)
 * @returns true if session expires within threshold
 */
export function isSessionExpiringSoon(
  session: Session | null,
  thresholdMs: number = SESSION_EXPIRY_THRESHOLD_MS
): boolean {
  if (!session?.expires_at) {
    return false;
  }

  const remaining = getSessionTimeRemaining(session);
  return remaining > 0 && remaining <= thresholdMs;
}
