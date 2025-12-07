"use client";

import type { JSX } from "react";
import { useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListGrid } from "@/components/dashboard/ListGrid";
import { mockLists } from "@/lib/mocks/lists";

type FilterType = "all" | "published" | "drafts";

/**
 * Dashboard page with authentication protection and responsive layout
 * Authentication is handled by middleware.ts and parent layout.tsx
 */
function DashboardPageContent(): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const filter = (searchParams.get("filter") as FilterType) || "all";

  const handleListClick = (listId: string) => {
    console.log("List clicked:", listId);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", newFilter);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const filteredLists = useMemo(() => {
    if (filter === "published") {
      return mockLists.filter((list) => list.isPublished);
    } else if (filter === "drafts") {
      return mockLists.filter((list) => !list.isPublished);
    }
    return mockLists;
  }, [filter]);

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

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b">
            <button
              onClick={() => handleFilterChange("all")}
              className={`border-primary text-primary hover:text-primary px-4 py-2 font-medium transition-colors ${
                filter === "all"
                  ? "border-b-2"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              All Lists
            </button>
            <button
              onClick={() => handleFilterChange("published")}
              className={`border-primary text-primary hover:text-primary px-4 py-2 font-medium transition-colors ${
                filter === "published"
                  ? "border-b-2"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => handleFilterChange("drafts")}
              className={`border-primary text-primary hover:text-primary px-4 py-2 font-medium transition-colors ${
                filter === "drafts"
                  ? "border-b-2"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              Drafts
            </button>
          </div>

          {/* List Grid or Empty State */}
          {filteredLists.length > 0 ? (
            <ListGrid lists={filteredLists} onListClick={handleListClick} />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg">
                {filter === "published"
                  ? "No published lists yet"
                  : filter === "drafts"
                    ? "No draft lists yet"
                    : "No lists yet"}
              </p>
              <p className="mt-2 text-sm">
                {filter === "published"
                  ? "Publish a list to see it here"
                  : filter === "drafts"
                    ? "Create a draft to see it here"
                    : "Create your first list to get started"}
              </p>
            </div>
          )}
        </div>
      </DashboardContent>
    </div>
  );
}

export default function DashboardPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
