"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * Dashboard page with authentication protection and responsive layout
 * Server-side auth is handled by parent layout.tsx
 * This component monitors session state client-side
 */
export default function DashboardPage(): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Monitor auth state changes (T015, T016, T017)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - Fixed on left */}
      <aside className="bg-background fixed top-0 left-0 hidden h-screen w-64 border-r lg:block">
        <DashboardSidebar />
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
              <DashboardSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Main Content Area */}
      <DashboardContent>
        <div className="mt-16 lg:mt-0">
          <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your dashboard. Features coming soon.
          </p>
        </div>
      </DashboardContent>
    </div>
  );
}
