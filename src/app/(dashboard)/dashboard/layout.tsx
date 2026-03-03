"use client";

import { useState, Suspense } from "react";
import type { ReactNode, JSX } from "react";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * Shared shell for all /dashboard/* pages.
 * Renders the fixed desktop sidebar and the mobile slide-out drawer,
 * then places {children} in the offset main content area.
 */
export default function DashboardShellLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar — fixed left */}
      <aside className="bg-background fixed top-0 left-0 hidden h-screen w-64 border-r lg:block">
        <Suspense fallback={<div className="p-6">Loading…</div>}>
          <DashboardSidebar />
        </Suspense>
      </aside>

      {/* Mobile Navigation Header */}
      <nav className="bg-background fixed top-0 right-0 left-0 z-50 border-b lg:hidden">
        <div className="p-4">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Suspense fallback={<div className="p-6">Loading…</div>}>
                <DashboardSidebar />
              </Suspense>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Main content area — offset by sidebar on desktop, mobile top-bar on mobile */}
      <DashboardContent>
        <div className="mt-16 lg:mt-0">{children}</div>
      </DashboardContent>
    </div>
  );
}
