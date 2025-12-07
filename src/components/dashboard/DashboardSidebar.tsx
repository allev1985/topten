"use client";

import type { JSX } from "react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  List,
  FileText,
  FileClock,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";
import { signOutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

/**
 * Reusable sidebar content component
 * Used in both desktop fixed sidebar and mobile drawer
 */
export function DashboardSidebar(): JSX.Element {
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") || "all";
  const [isListsExpanded, setIsListsExpanded] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutAction();
      // This line is not reached on success (redirect throws)
    } catch (err) {
      // Check if this is a redirect (Next.js throws for redirect)
      const isRedirect =
        (typeof err === "object" &&
          err !== null &&
          "digest" in err &&
          typeof (err as { digest: string }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) ||
        (err instanceof Error && err.message.startsWith("REDIRECT:"));

      if (isRedirect) {
        throw err;
      }

      // Only reached on actual error (not redirect)
      console.error("Failed to sign out:", err);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo/Branding */}
      <div className="border-b p-6">
        <h1 className="text-xl font-semibold">📍 YourFavs</h1>
      </div>

      {/* Navigation Container */}
      <nav className="flex-1 p-4">
        {/* Lists Section */}
        <div className="mb-4">
          <button
            onClick={() => setIsListsExpanded((prev) => !prev)}
            className="hover:bg-accent mb-2 flex w-full items-center gap-2 rounded px-3 py-2"
            aria-expanded={isListsExpanded}
          >
            <List className="h-4 w-4" />
            <span className="font-medium">Lists</span>
            <ChevronDown
              className={`ml-auto h-4 w-4 transition-transform ${isListsExpanded ? "" : "-rotate-90"}`}
            />
          </button>

          {/* Filter Navigation Items */}
          {isListsExpanded && (
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="hover:bg-accent data-[active=true]:bg-accent flex items-center gap-2 rounded px-3 py-2 text-sm data-[active=true]:font-medium"
                data-active={currentFilter === "all"}
                aria-current={currentFilter === "all" ? "page" : undefined}
              >
                <List className="h-4 w-4" />
                All Lists
              </Link>

              <Link
                href="/dashboard?filter=published"
                className="hover:bg-accent data-[active=true]:bg-accent flex items-center gap-2 rounded px-3 py-2 text-sm data-[active=true]:font-medium"
                data-active={currentFilter === "published"}
                aria-current={
                  currentFilter === "published" ? "page" : undefined
                }
              >
                <FileText className="h-4 w-4" />
                Published
              </Link>

              <Link
                href="/dashboard?filter=drafts"
                className="hover:bg-accent data-[active=true]:bg-accent flex items-center gap-2 rounded px-3 py-2 text-sm data-[active=true]:font-medium"
                data-active={currentFilter === "drafts"}
                aria-current={currentFilter === "drafts" ? "page" : undefined}
              >
                <FileClock className="h-4 w-4" />
                Drafts
              </Link>
            </div>
          )}
        </div>

        {/* Settings Link */}
        <Link
          href="/dashboard/settings"
          className="hover:bg-accent flex items-center gap-2 rounded px-3 py-2 text-sm"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>

      {/* Sign Out Button at Bottom */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
