import type { JSX } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllPlacesByUser, PlaceServiceError } from "@/lib/place";
import { PlacesClient } from "./_components/PlacesClient";

/**
 * My Places page — Server Component
 *
 * Fetches all places belonging to the authenticated user and passes
 * them with their active-list counts to the interactive PlacesClient.
 *
 * Data flow: page.tsx (server) → PlacesClient (client)
 * Mutations: PlacesClient → place-actions.ts → revalidatePath → here
 */
export default async function PlacesPage(): Promise<JSX.Element> {
  const sessionResult = await getSession();

  if (!sessionResult.authenticated || !sessionResult.user?.id) {
    redirect("/login");
  }

  let places: Awaited<ReturnType<typeof getAllPlacesByUser>> = [];
  let errorMessage: string | undefined;

  try {
    places = await getAllPlacesByUser({ userId: sessionResult.user.id });
  } catch (err) {
    errorMessage =
      err instanceof PlaceServiceError
        ? err.message
        : "Failed to load your places. Please try again.";
  }

  return <PlacesClient initialPlaces={places} initialError={errorMessage} />;
}
