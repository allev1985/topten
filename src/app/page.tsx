import type { Metadata } from "next";
import LandingPageClient from "./_components/landing-page-client";

export const metadata: Metadata = {
  title: "YourFavs - Curate and share your favorite places",
  description:
    "Discover and share curated lists of your favorite coffee shops, restaurants, bars, and more.",
  openGraph: {
    title: "YourFavs",
    description: "Curate and share your favorite places",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}
