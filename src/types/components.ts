/**
 * Component prop type definitions
 * Shared component interfaces and types
 */

/**
 * Props interface for the LandingPageClient component
 *
 * This interface defines the data contract between the server-rendered
 * page component and the client-side interactive wrapper component.
 */
export interface LandingPageClientProps {
  /**
   * Indicates whether the current user is authenticated
   *
   * This value is computed server-side by calling Supabase's `auth.getUser()`
   * and converting the result to a boolean: `!!user`.
   *
   * - `true`: User has a valid session and is authenticated
   * - `false`: User is a guest (not authenticated) or auth check failed
   *
   * When the auth check fails (network error, invalid token, etc.), this
   * value defaults to `false` as a security measure (fail-closed approach).
   *
   * This is a serializable primitive type, safe to pass from Server Components
   * to Client Components without causing hydration errors.
   */
  isAuthenticated: boolean;
}
