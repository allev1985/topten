"use client";

import type { JSX } from "react";
import { Badge } from "@/components/ui/badge";

/** Props for a single tag badge */
interface TagBadgeProps {
  /** Tag display name */
  name: string;
  /** Whether this is a system tag (Google Places taxonomy) */
  isSystem?: boolean;
  /** Optional click handler for interactive tags */
  onClick?: () => void;
  /** Optional remove handler — renders an × button */
  onRemove?: () => void;
}

/**
 * Renders a single tag as a styled badge.
 * System tags use the default variant; custom tags use outline.
 *
 * @param props - Tag badge properties
 * @returns Tag badge element
 */
export function TagBadge({
  name,
  isSystem,
  onClick,
  onRemove,
}: TagBadgeProps): JSX.Element {
  const variant = isSystem ? "default" : "outline";

  return (
    <Badge
      variant={variant}
      className="cursor-default gap-1 text-xs"
      onClick={onClick}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-destructive ml-0.5"
          aria-label={`Remove tag ${name}`}
        >
          ×
        </button>
      )}
    </Badge>
  );
}

/** Props for a list of tag badges */
interface TagBadgeListProps {
  /** Array of tags to display */
  tags: Array<{ name: string; source?: "system" | "custom" }>;
  /** Maximum tags to show before truncating */
  maxVisible?: number;
}

/**
 * Renders a horizontal list of tag badges with optional truncation.
 *
 * @param props - Tag badge list properties
 * @returns Tag badge list element
 */
export function TagBadgeList({
  tags,
  maxVisible,
}: TagBadgeListProps): JSX.Element | null {
  if (tags.length === 0) return null;

  const visible = maxVisible !== undefined ? tags.slice(0, maxVisible) : tags;
  const overflow = maxVisible !== undefined ? tags.length - maxVisible : 0;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag) => (
        <TagBadge
          key={tag.name}
          name={tag.name}
          isSystem={tag.source === "system"}
        />
      ))}
      {overflow > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{overflow}
        </Badge>
      )}
    </div>
  );
}
