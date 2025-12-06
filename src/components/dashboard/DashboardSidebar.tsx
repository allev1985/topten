import type { JSX } from "react";

/**
 * Reusable sidebar content component
 * Used in both desktop fixed sidebar and mobile drawer
 */
export function DashboardSidebar(): JSX.Element {
  return (
    <div className="flex h-full flex-col">
      {/* Logo/Branding */}
      <div className="border-b p-6">
        <h1 className="text-xl font-semibold">📍 YourFavs</h1>
      </div>

      {/* Navigation Container */}
      <nav className="flex-1 p-4">
        <div className="text-muted-foreground text-sm">
          Navigation items coming soon
        </div>
      </nav>
    </div>
  );
}
