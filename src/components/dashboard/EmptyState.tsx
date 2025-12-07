import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type FilterType = "all" | "published" | "drafts";

interface EmptyStateProps {
  filter: FilterType;
  onCreateClick: () => void;
}

/**
 * Get filter-aware empty state message
 */
function getEmptyStateMessage(filter: FilterType): {
  title: string;
  subtitle: string;
} {
  switch (filter) {
    case "published":
      return {
        title: "No published lists yet",
        subtitle: "Publish a list to see it here",
      };
    case "drafts":
      return {
        title: "No draft lists yet",
        subtitle: "Create a draft to see it here",
      };
    default:
      return {
        title: "No lists yet",
        subtitle: "Create your first list to get started",
      };
  }
}

/**
 * Empty state component with filter-aware messaging and CTA
 * Displayed when user has no lists matching the current filter
 */
export function EmptyState({ filter, onCreateClick }: EmptyStateProps) {
  const message = getEmptyStateMessage(filter);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="text-xl font-semibold">{message.title}</h3>
      <p className="text-muted-foreground mt-2 text-sm">{message.subtitle}</p>
      <Button onClick={onCreateClick} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Create New List
      </Button>
    </div>
  );
}
