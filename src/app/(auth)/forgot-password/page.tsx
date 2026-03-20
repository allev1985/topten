import type { JSX } from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

/**
 * Forgot password page
 * Allows users to request a password reset email
 */
export default function ForgotPasswordPage(): JSX.Element {
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
            Reset your password
          </p>
        </div>

        {/* Form */}
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
