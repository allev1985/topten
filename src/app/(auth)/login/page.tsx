import type { JSX } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string;
    email?: string;
  }>;
}

/**
 * Login page
 * Public page for user authentication
 */
export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { redirectTo, email } = params;

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
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <LoginForm redirectTo={redirectTo} defaultEmail={email} />
      </div>
    </div>
  );
}
