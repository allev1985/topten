import type { JSX } from "react";
import Link from "next/link";

/**
 * Verify email waiting page
 * Shown after signup to instruct user to check their email
 */
export default function VerifyEmailPage(): JSX.Element {
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
        </div>

        {/* Content */}
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Check your email
            </h1>
            <p className="text-muted-foreground">
              We&apos;ve sent you a verification link. Click it to complete your
              registration.
            </p>
          </div>

          <div className="text-muted-foreground space-y-1 text-sm">
            <p className="text-foreground font-medium">
              Didn&apos;t receive the email?
            </p>
            <ul className="space-y-1">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <Link href="/login" className="text-muted-foreground text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
