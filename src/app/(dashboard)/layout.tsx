import type { JSX } from "react";
import type { DashboardLayoutProps } from "@/types/components";

/**
 * Dashboard layout for protected pages
 * Authentication is handled by middleware.ts which protects all /dashboard and /settings routes
 */
export default function DashboardLayout({
  children,
}: DashboardLayoutProps): JSX.Element {
  return <>{children}</>;
}
