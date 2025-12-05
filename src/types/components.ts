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
   * This value is computed server-side by calling Supabase's `auth.getSession()`
   * and checking if a session exists: `!!session`.
   *
   * - `true`: User has an active session and is authenticated
   * - `false`: User is a guest (not authenticated) or no session exists
   *
   * Uses getSession() for lightweight checks on public pages.
   * Protected routes use getUser() for full JWT validation in middleware.
   *
   * This is a serializable primitive type, safe to pass from Server Components
   * to Client Components without causing hydration errors.
   */
  isAuthenticated: boolean;
}
