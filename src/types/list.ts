import type { ListSummary } from "@/lib/list/types";

/**
 * Props for ListCard component
 */
export interface ListCardProps {
  list: ListSummary;
  onClick: (listId: string) => void;
  onEdit?: (listId: string) => void;
  onPublishToggle?: (listId: string) => void;
  onDelete?: (listId: string) => void;
}

/**
 * Props for ListGrid component
 */
export interface ListGridProps {
  lists: ListSummary[];
  onListClick: (listId: string) => void;
  onEdit?: (listId: string) => void;
  onPublishToggle?: (listId: string) => void;
  onDelete?: (listId: string) => void;
}
