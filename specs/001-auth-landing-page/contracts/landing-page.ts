/**
 * Type Contracts for Auth-Aware Landing Page Feature
 * 
 * This file defines the TypeScript interfaces and types used for passing
 * authentication state from Server Components to Client Components.
 * 
 * @module contracts/landing-page
 */

/**
 * Props interface for the LandingPageClient component
 * 
 * This interface defines the data contract between the server-rendered
 * page component and the client-side interactive wrapper component.
 * 
 * @interface LandingPageClientProps
 * 
 * @example
 * ```typescript
 * // Server Component usage (src/app/page.tsx)
 * export default async function Home() {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   const isAuthenticated = !!user;
 *   
 *   return <LandingPageClient isAuthenticated={isAuthenticated} />;
 * }
 * 
 * // Client Component usage (src/components/shared/LandingPageClient.tsx)
 * 'use client';
 * 
 * export default function LandingPageClient({ isAuthenticated }: LandingPageClientProps) {
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <p>Welcome back!</p>
 *       ) : (
 *         <p>Welcome! Please sign up or log in.</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export interface LandingPageClientProps {
  /**
   * Indicates whether the current user is authenticated
   * 
   * This value is computed server-side by calling Supabase's `auth.getUser()`
   * and converting the result to a boolean: `!!user`.
   * 
   * @remarks
   * - `true`: User has a valid session and is authenticated
   * - `false`: User is a guest (not authenticated) or auth check failed
   * 
   * @remarks
   * When the auth check fails (network error, invalid token, etc.), this
   * value defaults to `false` as a security measure (fail-closed approach).
   * 
   * @remarks
   * This is a serializable primitive type, safe to pass from Server Components
   * to Client Components without causing hydration errors.
   */
  isAuthenticated: boolean;
}

/**
 * Internal type representing the result of a server-side auth check
 * 
 * This type is used within the Server Component but is NOT passed to clients.
 * It represents the transformation from Supabase's User object to a boolean.
 * 
 * @internal
 * 
 * @example
 * ```typescript
 * // Server Component implementation
 * const { data: { user } } = await supabase.auth.getUser();
 * const authState: AuthCheckResult = {
 *   isAuthenticated: !!user,
 *   user: user || undefined
 * };
 * ```
 */
export interface AuthCheckResult {
  /**
   * Whether the user is authenticated
   * Derived from the presence of a valid user object
   */
  isAuthenticated: boolean;

  /**
   * The authenticated user object (optional)
   * Only present when isAuthenticated is true
   * NOT passed to client components
   */
  user?: {
    id: string;
    email?: string;
    // Minimal user properties needed server-side
    // Full User type from @supabase/supabase-js if needed
  };
}

/**
 * Type guard to check if an auth check result indicates an authenticated user
 * 
 * @param result - The auth check result to validate
 * @returns True if the result indicates an authenticated user
 * 
 * @example
 * ```typescript
 * const result: AuthCheckResult = { isAuthenticated: true, user: mockUser };
 * if (isAuthCheckAuthenticated(result)) {
 *   // TypeScript knows result.user is defined here
 *   console.log(result.user.id);
 * }
 * ```
 */
export function isAuthCheckAuthenticated(
  result: AuthCheckResult
): result is AuthCheckResult & { user: NonNullable<AuthCheckResult['user']> } {
  return result.isAuthenticated && result.user !== undefined;
}

/**
 * Error type for auth check failures
 * 
 * Used to represent errors that occur during the authentication check process.
 * These errors are handled gracefully by defaulting to non-authenticated state.
 * 
 * @example
 * ```typescript
 * try {
 *   const { data: { user }, error } = await supabase.auth.getUser();
 *   if (error) {
 *     const authError: AuthCheckError = {
 *       type: 'AUTH_SERVICE_ERROR',
 *       message: error.message,
 *       timestamp: new Date()
 *     };
 *     // Log error, but continue with isAuthenticated = false
 *   }
 * } catch (e) {
 *   // Handle unexpected errors
 * }
 * ```
 */
export interface AuthCheckError {
  /**
   * The type of error that occurred
   */
  type: 'AUTH_SERVICE_ERROR' | 'NETWORK_ERROR' | 'INVALID_TOKEN' | 'UNKNOWN';

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * When the error occurred
   */
  timestamp: Date;

  /**
   * Original error object if available
   */
  originalError?: unknown;
}

/**
 * Constants for auth state
 */
export const AUTH_STATE = {
  /** User is authenticated with valid session */
  AUTHENTICATED: true,
  
  /** User is not authenticated or auth check failed */
  NOT_AUTHENTICATED: false,
} as const;

/**
 * Type representing possible auth states
 */
export type AuthState = typeof AUTH_STATE[keyof typeof AUTH_STATE];
