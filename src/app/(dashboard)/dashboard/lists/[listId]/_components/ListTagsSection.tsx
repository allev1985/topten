"use client";

import { useState } from "react";
import { Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditTagsForm } from "@/components/shared/EditTagsForm";

interface ListTagsSectionProps {
  listId: string;
  initialTags: string[];
}

/**
 * Collapsible tags section for the list detail page header.
 *
 * Shows current tag badges when collapsed; reveals the EditTagsForm
 * inline when the user clicks "Edit tags" / "Add tags".
 */
export function ListTagsSection({
  listId,
  initialTags,
}: ListTagsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="mt-4">
        <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
          Tags
        </p>
        <EditTagsForm
          entityId={listId}
          kind="list"
          initialTags={initialTags}
          onSuccess={() => setIsEditing(false)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {initialTags.length > 0 ? (
        initialTags.map((label) => (
          <Badge key={label} variant="secondary" className="text-xs">
            {label}
          </Badge>
        ))
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground h-6 gap-1 px-2 text-xs"
        onClick={() => setIsEditing(true)}
      >
        <Tags className="h-3 w-3" />
        {initialTags.length > 0 ? "Edit tags" : "Add tags"}
      </Button>
    </div>
  );
}
