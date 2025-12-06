"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import Header from "@/components/shared/Header";
import HeroImageGrid from "@/components/shared/HeroImageGrid";
import LoginModal from "@/components/shared/LoginModal";
import SignupModal from "@/components/shared/SignupModal";
import { Button } from "@/components/ui/button";

export default function LandingPageClient() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header onLogin={handleLogin} onSignup={openSignupModal} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo="/dashboard"
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12 lg:py-16">
        {/* Hero Section Container */}
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-6 md:gap-8 lg:grid-cols-5 lg:gap-12">
            {/* Hero Text Column (40% on desktop) */}
            <div className="col-span-1 flex flex-col justify-center space-y-4 md:space-y-6 lg:col-span-2">
              {/* Tagline with Sparkles Icon */}
              <div className="flex items-center gap-2">
                <Sparkles
                  className="h-4 w-4 text-zinc-600 dark:text-zinc-400"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Your personal guide to the world
                </p>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-bold tracking-tight text-black md:text-5xl lg:text-6xl dark:text-white">
                Curate and share your favourite places
              </h1>

              {/* Subheading */}
              <p className="max-w-prose text-lg text-zinc-600 md:text-xl dark:text-zinc-400">
                Build focused, meaningful collections that reflect your genuine
                preferences and local expertise. Share them like recommendations
                from a trusted friend.
              </p>

              {/* CTA Button */}
              <div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={openSignupModal}
                  className="min-h-[44px] font-semibold"
                >
                  Create Your First List
                </Button>
              </div>
            </div>

            {/* Hero Image Column (60% on desktop) */}
            <div className="col-span-1 lg:col-span-3">
              <HeroImageGrid />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
