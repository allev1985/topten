"use client";

import type { JSX } from "react";
import { useState, Suspense, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ListCardSkeleton } from "@/components/dashboard/ListCardSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ListGrid } from "@/components/dashboard/ListGrid";
import { mockLists } from "@/lib/mocks/lists";
import type { List } from "@/types/list";

type FilterType = "all" | "published" | "drafts";

type DashboardState =
  | { type: "loading" }
  | { type: "error"; error: Error }
  | { type: "success"; lists: List[] };

/**
 * Get filter tab button className based on active state
 */
function getFilterTabClassName(isActive: boolean): string {
  const baseClasses =
    "border-primary text-primary hover:text-primary px-4 py-2 font-medium transition-colors";
  const activeClasses = "border-b-2";
  const inactiveClasses =
    "text-muted-foreground hover:text-foreground border-b-2 border-transparent";

  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
}

/**
 * Dashboard page with authentication protection and responsive layout
 * Authentication is handled by middleware.ts and parent layout.tsx
 */
function DashboardPageContent(): JSX.Element {
  const [state, setState] = useState<DashboardState>({ type: "loading" });
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMountedRef = useRef(true);

  const filter = (searchParams.get("filter") as FilterType) || "all";

  // Track mounted state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Simulate data loading
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: simulating async data fetch
    setState({ type: "loading" });

    const timer = setTimeout(() => {
      // Simulate successful data fetch
      setState({ type: "success", lists: mockLists });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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

  const handleCreateClick = () => {
    console.log("Create new list clicked");
    // TODO: Navigate to list creation flow (future implementation)
  };

  const handleRetry = () => {
    setState({ type: "loading" });

    setTimeout(() => {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setState({ type: "success", lists: mockLists });
      }
    }, 500);
  };

  const filteredLists = useMemo(() => {
    if (state.type !== "success") return [];

    if (filter === "published") {
      return state.lists.filter((list) => list.isPublished);
    } else if (filter === "drafts") {
      return state.lists.filter((list) => !list.isPublished);
    }
    return state.lists;
  }, [state, filter]);

  return (
    <>
      <DashboardHeader />

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b">
            <button
              onClick={() => handleFilterChange("all")}
              className={getFilterTabClassName(filter === "all")}
            >
              All Lists
            </button>
            <button
              onClick={() => handleFilterChange("published")}
              className={getFilterTabClassName(filter === "published")}
            >
              Published
            </button>
            <button
              onClick={() => handleFilterChange("drafts")}
              className={getFilterTabClassName(filter === "drafts")}
            >
              Drafts
            </button>
          </div>

          {/* List Grid, Loading, Error, or Empty State */}
          {state.type === "loading" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array(6)
                .fill(null)
                .map((_, index) => (
                  <ListCardSkeleton key={`skeleton-${index}`} />
                ))}
            </div>
          ) : state.type === "error" ? (
            <ErrorState error={state.error} onRetry={handleRetry} />
          ) : filteredLists.length === 0 ? (
            <EmptyState filter={filter} onCreateClick={handleCreateClick} />
          ) : (
            <ListGrid lists={filteredLists} onListClick={handleListClick} />
          )}
    </>
  );
}

export default function DashboardPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
