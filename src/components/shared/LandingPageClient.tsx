"use client";

import { useState } from "react";
import Header from "@/components/shared/Header";
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
    <div className="flex min-h-screen flex-col bg-background">
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

      <main className="flex flex-1 items-center px-4 py-8 md:px-8 lg:py-0">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Large Logo */}
            <div className="flex items-center justify-center lg:justify-start">
              <span
                className="font-serif font-bold leading-none tracking-tight select-none text-[clamp(5rem,15vw,11rem)]"
                aria-label="myfaves"
              >
                <span className="text-foreground">my</span>
                <span className="text-violet-500 dark:text-violet-300">
                  faves
                </span>
              </span>
            </div>

            {/* Text + CTA */}
            <div className="flex flex-col space-y-6">
              <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Curate and share your favourite places
              </h1>

              <p className="text-lg text-muted-foreground md:text-xl">
                Build focused, meaningful collections that reflect your genuine
                preferences and local expertise. Share them like recommendations
                from a trusted friend.
              </p>

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
          </div>
        </div>
      </main>
    </div>
  );
}
