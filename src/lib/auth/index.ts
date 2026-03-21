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
  getSessionDirect,
  sendMFACode,
  verifyMFACode,
} from "./service";

export { invalidateSessionCache } from "./session-cache";

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
  VerifyMFAResult,
} from "./types";
