import type { JSX } from "react";
import { getSession } from "@/lib/auth/service";
import { getListsByUser } from "@/lib/list/service";
import { ListServiceError } from "@/lib/list/service/errors";
import { DashboardClient } from "./DashboardClient";

/**
 * Dashboard page — Server Component
 *
 * Fetches the authenticated user's lists at request time and passes
 * them to the interactive DashboardClient. Authentication is enforced
 * upstream by middleware.ts and the parent layout.
 *
 * Data flow: page.tsx (server) → DashboardClient (client)
 * Mutations:  DashboardClient → list-actions.ts → revalidatePath → here
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const sessionResult = await getSession();

  if (!sessionResult.authenticated || !sessionResult.user?.id) {
    // Middleware should prevent reaching here, but guard defensively.
    return (
      <DashboardClient initialLists={[]} initialError="Not authenticated" />
    );
  }

  let lists: Awaited<ReturnType<typeof getListsByUser>> = [];
  let errorMessage: string | undefined;

  try {
    lists = await getListsByUser(sessionResult.user.id);
  } catch (err) {
    errorMessage =
      err instanceof ListServiceError
        ? err.message
        : "Failed to load your lists. Please try again.";
  }

  return <DashboardClient initialLists={lists} initialError={errorMessage} />;
}
