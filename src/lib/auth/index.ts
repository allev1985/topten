/**
 * Auth Service public API
 * @module lib/auth
 */

export {
  signup,
  login,
  logout,
  resetPassword,
  updatePassword,
  changePassword,
  getSession,
} from "./service";

export { AuthServiceError } from "./errors";

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
} from "./types";
