"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function Header({ onLogin, onSignup }: HeaderProps) {
  return (
    <header className="w-full px-4 py-4 md:px-8">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="YourFavs home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500">
            <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-black dark:text-white">
            YourFavs
          </span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onLogin} className="min-h-[44px]">
            Log In
          </Button>
          <Button variant="default" onClick={onSignup} className="min-h-[44px]">
            Start Curating
          </Button>
        </div>
      </div>
    </header>
  );
}
