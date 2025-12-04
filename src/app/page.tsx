import { createClient } from "@/lib/supabase/server";
import LandingPageClient from "@/components/shared/LandingPageClient";

/**
 * Landing page with server-side authentication detection
 *
 * This async Server Component checks authentication status server-side
 * and passes a boolean prop to the Client Component for rendering.
 *
 * Benefits:
 * - No authentication flicker (auth check happens server-side)
 * - Fast initial page load (Server Component optimization)
 * - No hydration errors (consistent server/client rendering)
 * - Secure auth validation using getUser()
 */
export default async function Home() {
  // Create Supabase client for server-side operations
  const supabase = await createClient();

  // Check authentication status using getUser() for security
  // This validates the JWT token server-side
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Convert to boolean for serializable prop
  // Fail-closed: default to false on error for security
  const isAuthenticated = error ? false : !!user;

  // Development logging for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("[Landing Page] Auth check:", {
      isAuthenticated,
      userId: user?.id,
      hasError: !!error,
      errorMessage: error?.message,
    });
  }

  // Pass boolean to Client Component (avoids serialization issues)
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
