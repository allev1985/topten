"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/shared/Header";
import LoginModal from "@/components/shared/LoginModal";
import { Button } from "@/components/ui/button";

export default function LandingPageClient() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header onLogin={handleLogin} onSignup={handleSignup} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo="/dashboard"
      />

      <main className="flex flex-1 items-center px-4 py-8 md:px-8 lg:py-0">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Large Logo */}
            <div className="flex items-center justify-center lg:justify-start">
              <span
                className="font-serif text-[clamp(5rem,15vw,11rem)] leading-none font-bold tracking-tight select-none"
                aria-label="myfaves"
              >
                <span className="text-foreground">my</span>
                <span className="text-violet-700">faves</span>
              </span>
            </div>

            {/* Text + CTA */}
            <div className="flex flex-col space-y-6">
              <h1 className="text-foreground font-serif text-4xl font-bold tracking-tight md:text-5xl">
                Curate and share your favourite places
              </h1>

              <p className="text-muted-foreground text-lg md:text-xl">
                Build focused, meaningful collections that reflect your genuine
                preferences and local expertise. Share them like recommendations
                from a trusted friend.
              </p>

              <div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleSignup}
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
