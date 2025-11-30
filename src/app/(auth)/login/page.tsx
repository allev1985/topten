import type { JSX } from "react";
import { AuthCard } from "@/components/auth/auth-card";
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
    <AuthCard
      title="Sign In"
      description="Enter your credentials to access your account"
      footer={
        <div>
          <p>
            Don&apos;t have an account? <a href="/signup">Sign up</a>
          </p>
          <p>
            <a href="/forgot-password">Forgot your password?</a>
          </p>
          <hr />
          <p>
            <button type="button" disabled>
              Sign in with Google (coming soon)
            </button>
          </p>
        </div>
      }
    >
      <LoginForm redirectTo={redirectTo} defaultEmail={email} />
    </AuthCard>
  );
}
