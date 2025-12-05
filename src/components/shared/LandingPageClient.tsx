"use client";

import Header from "@/components/shared/Header";

export default function LandingPageClient() {
  const handleLogin = () => {
    // TODO: Open login modal (future feature)
    console.log("Login clicked");
  };

  const handleSignup = () => {
    // TODO: Open signup modal (future feature)
    console.log("Signup clicked");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header onLogin={handleLogin} onSignup={handleSignup} />

      <main className="flex flex-1 flex-col items-center justify-center">
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
