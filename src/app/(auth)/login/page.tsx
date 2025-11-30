import type { JSX } from "react";
import { LoginForm } from "./login-form";

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
    <main>
      <LoginForm redirectTo={redirectTo} defaultEmail={email} />
    </main>
  );
}
