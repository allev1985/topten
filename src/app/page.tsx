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
 * - Lightweight session check (no JWT validation needed for public page)
 *
 * Note: Uses getSession() instead of getUser() for public pages.
 * The middleware handles session validation for protected routes.
 */
export default async function Home() {
  // Create Supabase client for server-side operations
  const supabase = await createClient();

  // Check for existing session (lightweight check, no JWT validation)
  // For public landing page, we only need to know if user has a session
  // Middleware handles session refresh and validation for protected routes
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Convert to boolean for serializable prop
  const isAuthenticated = !!session;

  // Development logging for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("[Landing Page] Auth status:", {
      isAuthenticated,
      userId: session?.user?.id,
    });
  }

  // Pass boolean to Client Component (avoids serialization issues)
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
