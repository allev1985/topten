import type { Metadata } from "next";
import LandingPageClient from "@/components/shared/LandingPageClient";

export const metadata: Metadata = {
  title: "myfaves - Curate and share your favorite places",
  description:
    "Discover and share curated lists of your favorite coffee shops, restaurants, bars, and more.",
  openGraph: {
    title: "myfaves",
    description: "Curate and share your favorite places",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}
