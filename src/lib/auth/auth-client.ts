/**
 * BetterAuth client — for use in Client Components only.
 *
 * Import `authClient` and use its methods directly:
 *   authClient.signIn.email(...)
 *   authClient.signUp.email(...)
 *   authClient.useSession()
 *
 * For server-side auth use `auth` from `@/lib/auth/auth` instead.
 */

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
