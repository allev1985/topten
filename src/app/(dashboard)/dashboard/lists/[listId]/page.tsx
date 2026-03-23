import type { JSX } from "react";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import {
  getPlacesByList,
  getAvailablePlacesForList,
  PlaceServiceError,
} from "@/lib/place";
import { getListsByUser } from "@/lib/list";
import { PlaceList } from "./_components/PlaceList";
import { ListTagsSection } from "./_components/ListTagsSection";

interface ListDetailPageProps {
  params: Promise<{ listId: string }>;
}

/**
 * List detail page — Server Component
 *
 * Fetches the authenticated user's places for a given list and passes
 * them to the interactive PlaceList client component.
 *
 * Data flow: page.tsx (server) → PlaceList (client)
 * Mutations: PlaceList dialogs → place-actions.ts → revalidatePath → here
 */
export default async function ListDetailPage({
  params,
}: ListDetailPageProps): Promise<JSX.Element> {
  const { listId } = await params;

  const sessionResult = await getSession();
  if (!sessionResult.authenticated || !sessionResult.user?.id) {
    redirect("/login");
  }

  const userId = sessionResult.user.id;

  // Resolve list title (and ownership) — getListsByUser already filters by userId
  const userLists = await getListsByUser(userId);
  const list = userLists.find((l) => l.id === listId);
  if (!list) {
    notFound();
  }

  let places: Awaited<ReturnType<typeof getPlacesByList>> = [];
  let availablePlaces: Awaited<ReturnType<typeof getAvailablePlacesForList>> =
    [];
  let errorMessage: string | undefined;

  try {
    [places, availablePlaces] = await Promise.all([
      getPlacesByList(listId),
      getAvailablePlacesForList({ listId, userId }),
    ]);
  } catch (err) {
    errorMessage =
      err instanceof PlaceServiceError
        ? err.message
        : "Failed to load places. Please try again.";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{list.title}</h1>
        {list.description && (
          <p className="text-muted-foreground mt-2 text-sm">
            {list.description}
          </p>
        )}
        <ListTagsSection initialTags={list.tags ?? []} />
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm"
        >
          {errorMessage}
        </div>
      ) : (
        <PlaceList
          listId={listId}
          places={places}
          availablePlaces={availablePlaces}
        />
      )}
    </div>
  );
}
