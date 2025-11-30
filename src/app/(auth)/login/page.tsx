import type { JSX } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTo} defaultEmail={email} />
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
          <p>
            Don&apos;t have an account? <a href="/signup">Sign up</a>
          </p>
          <p>
            <a href="/forgot-password">Forgot your password?</a>
          </p>
          <hr className="w-full" />
          <p>
            <button type="button" disabled>
              Sign in with Google (coming soon)
            </button>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
