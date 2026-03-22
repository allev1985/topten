import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/styling/cn";
import type { TagSummary } from "@/lib/tag";

/**
 * Props for {@link TagBadgeList}.
 */
export interface TagBadgeListProps {
  /** Tags to render. Empty arrays render nothing. */
  tags: Pick<TagSummary, "id" | "label" | "isSystem">[];
  /** Badge sizing — `sm` is suited to dense card layouts. */
  size?: "sm" | "default";
  /** Extra class names for the wrapper element. */
  className?: string;
}

/**
 * Read-only row of tag badges for public and dashboard views.
 *
 * System tags (Google Places taxonomy) render with the `secondary` variant;
 * custom tags render with `outline` so viewers can distinguish curated
 * categories from creator-defined labels.
 *
 * @param props - {@link TagBadgeListProps}
 * @returns A flex-wrapped badge row, or `null` when `tags` is empty
 */
export function TagBadgeList({
  tags,
  size = "default",
  className,
}: TagBadgeListProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant={tag.isSystem ? "secondary" : "outline"}
          className={cn(size === "sm" && "px-2 py-0 text-[10px]")}
        >
          {tag.label}
        </Badge>
      ))}
    </div>
  );
}
