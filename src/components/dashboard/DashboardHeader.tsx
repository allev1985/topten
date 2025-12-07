"use client";

import type { JSX } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard header component with title and New List button
 * Displays page heading and provides quick access to create a new list
 */
export function DashboardHeader(): JSX.Element {
  const handleNewList = () => {
    console.log("New list clicked");
  };

  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize your curated collections
          </p>
        </div>
        <Button onClick={handleNewList}>
          <Plus className="mr-2 h-4 w-4" />
          New List
        </Button>
      </div>
    </header>
  );
}
