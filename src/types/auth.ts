// Application auth types — no dependency on any auth library's internal types.

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

export type AuthState =
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; user: null }
  | { status: "loading"; user: null };

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

/**
 * Session information for routing and display purposes.
 */
export interface SessionInfo {
  isValid: boolean;
  user: { id: string; email?: string } | null;
  expiresAt: Date | null;
  isExpiringSoon: boolean;
}
