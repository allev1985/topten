"use client";

import type { JSX } from "react";
import { useState, Suspense } from "react";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListGrid } from "@/components/dashboard/ListGrid";
import { mockLists } from "@/lib/mocks/lists";

/**
 * Dashboard page with authentication protection and responsive layout
 * Authentication is handled by middleware.ts and parent layout.tsx
 */
export default function DashboardPage(): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleListClick = (listId: string) => {
    console.log("List clicked:", listId);
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - Fixed on left */}
      <aside className="bg-background fixed top-0 left-0 hidden h-screen w-64 border-r lg:block">
        <Suspense fallback={<div className="p-6">Loading...</div>}>
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
              <Suspense fallback={<div className="p-6">Loading...</div>}>
                <DashboardSidebar />
              </Suspense>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Main Content Area */}
      <DashboardContent>
        <div className="mt-16 lg:mt-0">
          <DashboardHeader />
          <ListGrid lists={mockLists} onListClick={handleListClick} />
        </div>
      </DashboardContent>
    </div>
  );
}
