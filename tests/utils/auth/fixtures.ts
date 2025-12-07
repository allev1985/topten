/**
 * Test fixtures for Auth Service tests
 *
 * Provides standardized test data (users, credentials, tokens, errors)
 * to ensure consistency across auth tests.
 */

/**
 * Standard test user credentials
 */
export const TEST_CREDENTIALS = {
  email: "test@example.com",
  password: "SecurePass123!",
  weakPassword: "weak",
  invalidEmail: "invalid-email",
} as const;

/**
 * Standard test user data
 */
export const TEST_USER = {
  id: "user-123",
  email: TEST_CREDENTIALS.email,
  created_at: "2024-01-01T00:00:00.000Z",
} as const;

/**
 * Test tokens and hashes
 */
export const TEST_TOKENS = {
  validTokenHash: "valid-token-hash-123",
  expiredTokenHash: "expired-token-hash-456",
  invalidTokenHash: "invalid-token-hash-789",
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
} as const;

/**
 * Standard error messages for testing
 */
export const ERROR_MESSAGES = {
  invalidCredentials: "Invalid email or password",
  emailNotConfirmed: "Please verify your email before logging in",
  userExists: "User already exists",
  networkError: "Network error",
  expiredToken: "Token has expired",
  invalidToken: "Invalid token",
  sessionExpired: "Session has expired. Please log in again.",
} as const;

/**
 * Test redirect URLs
 */
export const TEST_URLS = {
  verifyEmail: "https://example.com/verify",
  resetPassword: "https://example.com/reset",
  dashboard: "/dashboard",
  login: "/login",
} as const;
