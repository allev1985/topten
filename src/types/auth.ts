import type { User, Session } from "@supabase/supabase-js";

// Re-exported from @supabase/supabase-js with application-specific aliases
export type AuthUser = User;
export type AuthSession = Session;

// Application-specific types
export interface AuthError {
  code: string;
  message: string;
  status?: number;
}

export type AuthState =
  | { status: "authenticated"; user: AuthUser; session: AuthSession }
  | { status: "unauthenticated"; user: null; session: null }
  | { status: "loading"; user: null; session: null };

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
