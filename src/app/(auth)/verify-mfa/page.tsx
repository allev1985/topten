import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VerifyMFAForm } from "./_components/VerifyMFAForm";
import { config } from "@/lib/config/client";
import { isValidRedirect } from "@/lib/utils/validation/redirect";
import { sendMFACode, getSession } from "@/lib/auth";

interface VerifyMFAPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

/**
 * MFA verification page
 * Shown after successful password login when the user has MFA enabled.
 *
 * Access rules:
 *  - Already authenticated → redirect to destination (nothing to verify)
 *  - No valid two-factor cookie (not mid-login) → redirect to /login
 *  - Valid two-factor cookie → send code and show form
 */
export default async function VerifyMFAPage({
  searchParams,
}: VerifyMFAPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const redirectTo =
    params.redirectTo && isValidRedirect(params.redirectTo)
      ? params.redirectTo
      : config.auth.redirectRoutes.default;

  const session = await getSession();
  if (session.authenticated) {
    redirect(redirectTo);
  }

  try {
    await sendMFACode();
  } catch {
    redirect("/login");
  }

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
            Check your email for a verification code
          </p>
        </div>

        {/* Form */}
        <VerifyMFAForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
