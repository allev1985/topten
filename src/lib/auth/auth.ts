/**
 * BetterAuth configuration
 *
 * Single source of truth for the auth instance used by:
 *  - the API route handler  (src/app/api/auth/[...all]/route.ts)
 *  - server actions         (via auth.api.*)
 *  - server components      (via auth.api.getSession)
 *  - middleware / proxy     (session cookie check)
 *
 * @see docs/decisions/authentication.md
 */

import { betterAuth, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "@/lib/services/email";
import { generateVanitySlug } from "@/lib/utils/formatting/slug";
import { createServiceLogger } from "@/lib/services/logging";
import { config } from "@/lib/config";

const log = createServiceLogger("auth");

export const auth = betterAuth({
  secret: config.authSecret,
  baseURL: config.appUrl,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      twoFactor: schema.twoFactors,
    },
  }),

  // Use UUIDs for all BetterAuth-managed record IDs
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  // Additional fields stored on the user record beyond BetterAuth's defaults
  user: {
    additionalFields: {
      vanitySlug: { type: "string", required: false, input: false },
      bio: { type: "string", required: false },
      deletedAt: { type: "date", required: false },
    },
  },

  // Email and password authentication (core feature, not a plugin)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: config.auth.password.minLength,
    sendResetPassword: async (
      { user, url }: { user: User; url: string; token: string },
      _request?: Request
    ) => {
      log.info(
        { method: "sendResetPassword", userId: user.id },
        "Sending password reset email"
      );
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `
          <p>You requested a password reset for your myfaves account.</p>
          <p><a href="${url}">Click here to reset your password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        `,
        text: `Reset your password: ${url}`,
      });
    },
  },

  // Email verification
  emailVerification: {
    sendVerificationEmail: async (
      { user, url }: { user: User; url: string; token: string },
      _request?: Request
    ) => {
      log.info(
        { method: "sendVerificationEmail", userId: user.id },
        "Sending verification email"
      );
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `
          <p>Welcome to myfaves! Please verify your email address to get started.</p>
          <p><a href="${url}">Click here to verify your email</a></p>
          <p>This link expires in 24 hours.</p>
        `,
        text: `Verify your email: ${url}`,
      });
    },
    autoSignInAfterVerification: true,
  },

  // Auto-generate vanitySlug from the user's name before the DB insert
  databaseHooks: {
    user: {
      create: {
        before: async (user: User & Record<string, unknown>) => {
          const emailPrefix =
            ((user.email as string | undefined) ?? "user").split("@")[0] ??
            "user";
          const nameBase: string =
            (user.name as string | undefined) ?? emailPrefix;
          const vanitySlug = generateVanitySlug(nameBase);
          log.debug(
            { method: "databaseHooks.user.create.before", vanitySlug },
            "Generated vanity slug"
          );
          return { data: { ...user, vanitySlug, twoFactorEnabled: true } };
        },
      },
    },
  },

  plugins: [
    // Email OTP MFA — mandatory for all users.
    // After a successful password login, BetterAuth sets a two-factor cookie
    // and returns { twoFactorRedirect: true }. The client then calls
    // sendTwoFactorOTP (which sends the email) and verifyTwoFactorOTP
    // (which creates the full session).
    //
    // IMPORTANT: twoFactor must be listed BEFORE nextCookies so that the
    // twoFactor after-hook (which sets the two-factor cookie in responseHeaders)
    // runs before the nextCookies after-hook (which flushes responseHeaders to
    // the Next.js cookie store). Hooks execute in plugin-array order.
    twoFactor({
      otpOptions: {
        period: 10, // minutes
        sendOTP: async ({ user, otp }) => {
          log.info(
            { method: "sendMFAOTP", userId: user.id },
            "Sending MFA verification code"
          );
          await sendEmail({
            to: user.email,
            subject: "Your myfaves login code",
            html: `
              <p>Your login verification code is:</p>
              <p style="font-size:2rem;font-weight:bold;letter-spacing:0.2em">${otp}</p>
              <p>This code expires in 10 minutes. If you didn't try to log in, you can ignore this email.</p>
            `,
            text: `Your myfaves login verification code is: ${otp}. Expires in 10 minutes.`,
          });
        },
      },
    }),
    nextCookies(),
  ],
});
