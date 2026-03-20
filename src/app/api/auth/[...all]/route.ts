import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * BetterAuth route handler.
 *
 * Handles all auth endpoints under /api/auth/*:
 *   POST /api/auth/sign-in/email
 *   POST /api/auth/sign-up/email
 *   POST /api/auth/sign-out
 *   POST /api/auth/forget-password
 *   POST /api/auth/reset-password
 *   POST /api/auth/change-password
 *   GET  /api/auth/verify-email
 *   GET  /api/auth/get-session
 *   ...and more managed internally by BetterAuth
 */
export const { GET, POST } = toNextJsHandler(auth);
