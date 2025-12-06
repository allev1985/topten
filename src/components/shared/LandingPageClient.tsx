"use client";

import { useState } from "react";
import Header from "@/components/shared/Header";
import HeroImageGrid from "@/components/shared/HeroImageGrid";
import LoginModal from "@/components/shared/LoginModal";
import SignupModal from "@/components/shared/SignupModal";

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

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-8">
        {/* Hero Image Grid */}
        <HeroImageGrid />

        {/* Existing content */}
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
            YourFavs
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            Curate and share your favorite places
          </p>
        </div>
      </main>
    </div>
  );
}
