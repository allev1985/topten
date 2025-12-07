/**
 * List entity representing a curator's collection of places
 * Used for dashboard grid display
 *
 * @property id - Unique identifier (UUID)
 * @property title - Display name of the list
 * @property heroImageUrl - URL to hero/cover image
 * @property isPublished - Publication status (true = published, false = draft)
 * @property placeCount - Number of places in the list
 */
export interface List {
  id: string;
  title: string;
  heroImageUrl: string;
  isPublished: boolean;
  placeCount: number;
}

/**
 * Props for ListCard component
 */
export interface ListCardProps {
  list: List;
  onClick: (listId: string) => void;
}

/**
 * Props for ListGrid component
 */
export interface ListGridProps {
  lists: List[];
  onListClick: (listId: string) => void;
}
