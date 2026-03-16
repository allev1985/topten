/**
 * Client-safe configuration constants.
 *
 * No environment variables, no server secrets — safe to import from
 * Client Components. The server config (`@/lib/config`) re-exports these
 * as part of the same `config` object, so server code never needs to
 * import from here directly.
 */

export const config = {
  auth: {
    password: {
      minLength: 12,
      minWeakChecks: 2,
      minMediumChecks: 4,
      specialCharRegex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    },
    sessionExpiryThresholdMs: 5 * 60 * 1000,
    redirectRoutes: {
      default: "/dashboard",
      auth: {
        success: "/dashboard",
        error: "/auth/error",
        passwordReset: "/reset-password",
      },
    },
    verificationTypeEmail: "email" as const,
    protectedRoutes: ["/dashboard", "/settings"] as const,
    publicRoutes: [
      "/",
      "/login",
      "/signup",
      "/verify-email",
      "/forgot-password",
      "/reset-password",
      "/auth",
    ] as const,
  },
  routes: {
    dashboard: {
      home: "/dashboard",
      listDetail: (listId: string) => `/dashboard/lists/${listId}`,
      places: "/dashboard/places",
    },
  },
} as const;
