import type { JSX, ReactNode } from "react";

interface DashboardContentProps {
  children: ReactNode;
}

/**
 * Main content area wrapper with responsive margin
 * Offsets desktop sidebar width (lg:ml-64)
 */
export function DashboardContent({
  children,
}: DashboardContentProps): JSX.Element {
  return (
    <main className="min-h-screen lg:ml-64">
      <div className="p-6">{children}</div>
    </main>
  );
}
