/**
 * Re-exports from the auth service types module.
 * Auth domain types are defined in @/lib/auth/types.
 * @module types/auth
 */

export type {
  AuthUser,
  AuthError,
  AuthState,
  AuthResult,
  SessionInfo,
  SignupResult,
  LoginResult,
  LogoutResult,
  ResetPasswordResult,
  UpdatePasswordResult,
  SessionResult,
} from "@/lib/auth/types";
