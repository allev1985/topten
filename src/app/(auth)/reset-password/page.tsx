import type { JSX } from "react";
import Link from "next/link";
import { PasswordResetForm } from "./password-reset-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

/**
 * Reset password page
 * Allows users to set a new password after clicking reset link
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { token } = params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-80"
            aria-label="myfaves home"
          >
            <span
              className="font-serif text-4xl leading-none tracking-tight select-none"
              aria-label="myfaves"
            >
              <span className="text-foreground">my</span>
              <span className="text-violet-700">faves</span>
            </span>
          </Link>
          <p className="text-muted-foreground mt-3 text-sm">
            {token ? "Set a new password" : "Invalid reset link"}
          </p>
        </div>

        {/* Content */}
        {token ? (
          <PasswordResetForm token={token} />
        ) : (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="text-muted-foreground text-sm"
            >
              Request a new reset link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
