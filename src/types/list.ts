import type { ListSummary } from "@/lib/list/service/types";

export type { ListSummary };

/**
 * List entity representing a curator's collection of places.
 * Used for dashboard grid display.
 *
 * @property id - Unique identifier (UUID)
 * @property title - Display name of the list
 * @property slug - Immutable system-assigned 4-char hex identifier
 * @property description - Optional curator description
 * @property isPublished - Publication status (true = published, false = draft)
 * @property placeCount - Number of places in the list (0 until place service is implemented)
 * @property createdAt - Timestamp of creation
 */
export interface List {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  isPublished: boolean;
  placeCount: number;
  createdAt?: Date;
}

/**
 * Props for ListCard component
 */
export interface ListCardProps {
  list: List;
  onClick: (listId: string) => void;
  onEdit?: (listId: string) => void;
  onPublishToggle?: (listId: string) => void;
  onDelete?: (listId: string) => void;
}

/**
 * Props for ListGrid component
 */
export interface ListGridProps {
  lists: List[];
  onListClick: (listId: string) => void;
  onEdit?: (listId: string) => void;
  onPublishToggle?: (listId: string) => void;
  onDelete?: (listId: string) => void;
}
