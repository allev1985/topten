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
  // Note: Middleware already handles session refresh, so errors here
  // (like invalid refresh tokens) are expected for guest users
  let isAuthenticated = false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Convert to boolean for serializable prop
    isAuthenticated = !!user;

    // Development logging for debugging
    if (process.env.NODE_ENV === "development" && user) {
      console.log("[Landing Page] Authenticated user:", {
        userId: user.id,
      });
    }
  } catch {
    // Silently handle auth errors for public landing page
    // Middleware has already attempted session refresh
    // Any errors here indicate no valid session (guest user)
    if (process.env.NODE_ENV === "development") {
      console.log("[Landing Page] Guest user (auth check failed silently)");
    }
  }

  // Pass boolean to Client Component (avoids serialization issues)
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
