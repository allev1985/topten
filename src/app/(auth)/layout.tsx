import type { JSX, ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Auth layout for public authentication pages
 * Provides minimal wrapper for signup, login, forgot/reset password, and email verification
 */
export default function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return <>{children}</>;
}
