import type { JSX, ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard layout for protected pages
 * Authentication is handled by middleware.ts which protects all /dashboard and /settings routes
 */
export default function DashboardLayout({
  children,
}: DashboardLayoutProps): JSX.Element {
  return <>{children}</>;
}
