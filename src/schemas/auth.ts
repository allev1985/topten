import { z } from "zod";
import { PASSWORD_REQUIREMENTS, VERIFICATION_TYPE_EMAIL } from "@/lib/config";

/**
 * Schema for validating signup requests
 *
 * Email validation:
 * - Required field
 * - Must be valid email format
 * - Trimmed and lowercased for consistency
 *
 * Password validation:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const signupSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z
      .string({ message: "Email is required" })
      .min(1, "Email is required")
      .email("Invalid email format")
  ),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .min(
      PASSWORD_REQUIREMENTS.minLength,
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
    )
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      PASSWORD_REQUIREMENTS.specialCharRegex,
      "Password must contain at least one special character"
    ),
});

/**
 * Schema for validating OTP-based email verification
 * Used when verifying via token_hash parameter
 */
export const verifyTokenSchema = z.object({
  token_hash: z.string().min(1, "Token is required"),
  type: z.literal(VERIFICATION_TYPE_EMAIL),
});

/**
 * Schema for validating PKCE code exchange
 * Used when verifying via authorization code
 */
export const verifyCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

/**
 * Consistent response schema for user enumeration protection
 * Returns the same message for both new and existing users
 */
export const signupSuccessResponse = {
  success: true,
  message: "Please check your email to verify your account",
} as const;

/**
 * Schema for validating login requests
 * Password validation is minimal (presence only) unlike signup
 */
export const loginSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z
      .string({ message: "Email is required" })
      .min(1, "Email is required")
      .email("Invalid email format")
  ),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
  redirectTo: z.string().optional(),
});

/**
 * Schema for validating password reset requests
 * Only requires email - follows existing preprocessing pattern
 */
export const passwordResetSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z
      .string({ message: "Email is required" })
      .min(1, "Email is required")
      .email("Invalid email format")
  ),
});

/**
 * Schema for validating password update requests
 * Uses same password validation as signup
 */
export const passwordUpdateSchema = z.object({
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .min(
      PASSWORD_REQUIREMENTS.minLength,
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
    )
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      PASSWORD_REQUIREMENTS.specialCharRegex,
      "Password must contain at least one special character"
    ),
});

// Type exports for use in other modules
export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
