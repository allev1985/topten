"use client";

import type { JSX } from "react";
import { useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ListCardSkeleton } from "@/components/dashboard/ListCardSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ListGrid } from "@/components/dashboard/ListGrid";
import { CreateListForm } from "@/components/dashboard/CreateListForm";
import { EditListForm } from "@/components/dashboard/EditListForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteListAction,
  publishListAction,
  unpublishListAction,
} from "@/actions/list-actions";
import type { ListSummary } from "@/lib/list/service/types";
import type { List } from "@/types/list";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = "all" | "published" | "drafts";

interface EditTarget {
  id: string;
  title: string;
  description?: string | null;
}

interface DashboardClientProps {
  initialLists: ListSummary[];
  initialError?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFilterTabClassName(isActive: boolean): string {
  const base =
    "border-primary text-primary hover:text-primary px-4 py-2 font-medium transition-colors";
  const active = "border-b-2";
  const inactive =
    "text-muted-foreground hover:text-foreground border-b-2 border-transparent";
  return `${base} ${isActive ? active : inactive}`;
}

function mapToList(summary: ListSummary): List {
  return {
    id: summary.id,
    title: summary.title,
    slug: summary.slug,
    description: summary.description ?? undefined,
    isPublished: summary.isPublished,
    createdAt: summary.createdAt,
    placeCount: 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

function DashboardContent({
  initialLists,
  initialError,
}: DashboardClientProps): JSX.Element {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const filter = (searchParams.get("filter") as FilterType) || "all";

  const lists: List[] = useMemo(
    () => initialLists.map(mapToList),
    [initialLists]
  );

  const filteredLists = useMemo(() => {
    if (filter === "published") return lists.filter((l) => l.isPublished);
    if (filter === "drafts") return lists.filter((l) => !l.isPublished);
    return lists;
  }, [lists, filter]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleFilterChange = (newFilter: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", newFilter);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleListClick = (listId: string) => {
    router.push(`/dashboard/list/${listId}`);
  };

  const handleRetry = () => {
    setActionError(null);
    router.refresh();
  };

  // ── Create dialog ───────────────────────────────────────────────────────────

  const handleNewList = () => setIsCreateOpen(true);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    router.refresh();
  };

  // ── Edit dialog ─────────────────────────────────────────────────────────────

  const handleEdit = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    setEditTarget({ id: list.id, title: list.title, description: list.description });
  };

  const handleEditSuccess = () => {
    setEditTarget(null);
    router.refresh();
  };

  // ── Publish / Unpublish ─────────────────────────────────────────────────────

  const handlePublishToggle = async (listId: string) => {
    setActionError(null);
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const formData = new FormData();
    formData.set("listId", listId);

    const action = list.isPublished ? unpublishListAction : publishListAction;
    const result = await action(
      { data: null, error: null, fieldErrors: {}, isSuccess: false },
      formData
    );

    if (!result.isSuccess && result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (listId: string) => {
    setActionError(null);
    const formData = new FormData();
    formData.set("listId", listId);

    const result = await deleteListAction(
      { data: null, error: null, fieldErrors: {}, isSuccess: false },
      formData
    );

    if (!result.isSuccess && result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const displayError = initialError ?? actionError;

  return (
    <>
      <DashboardHeader onNewList={handleNewList} />

      {/* Action-level error banner */}
      {actionError && !initialError && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive mb-6 rounded-md px-4 py-3 text-sm"
        >
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => handleFilterChange("all")}
          className={getFilterTabClassName(filter === "all")}
        >
          All Lists
        </button>
        <button
          onClick={() => handleFilterChange("published")}
          className={getFilterTabClassName(filter === "published")}
        >
          Published
        </button>
        <button
          onClick={() => handleFilterChange("drafts")}
          className={getFilterTabClassName(filter === "drafts")}
        >
          Drafts
        </button>
      </div>

      {/* Content */}
      {displayError && initialError ? (
        <ErrorState error={new Error(displayError)} onRetry={handleRetry} />
      ) : filteredLists.length === 0 ? (
        <EmptyState filter={filter} onCreateClick={handleNewList} />
      ) : (
        <ListGrid
          lists={filteredLists}
          onListClick={handleListClick}
          onEdit={handleEdit}
          onPublishToggle={handlePublishToggle}
          onDelete={handleDelete}
        />
      )}

      {/* Create List Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <CreateListForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <EditListForm
              listId={editTarget.id}
              initialTitle={editTarget.title}
              initialDescription={editTarget.description ?? ""}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DashboardClient(props: DashboardClientProps): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(null)
            .map((_, i) => (
              <ListCardSkeleton key={`skeleton-${i}`} />
            ))}
        </div>
      }
    >
      <DashboardContent {...props} />
    </Suspense>
  );
}
