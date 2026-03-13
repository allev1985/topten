"use client";

import Link from "next/link";
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
          className="flex items-center transition-opacity hover:opacity-80"
          aria-label="myfaves home"
        >
          <span
            className="font-serif text-2xl leading-none tracking-tight select-none"
            aria-label="myfaves"
          >
            <span className="text-foreground">my</span>
            <span className="text-violet-500 dark:text-violet-300">faves</span>
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
