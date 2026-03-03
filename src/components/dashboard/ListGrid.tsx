import { ListCard } from "./ListCard";
import type { ListGridProps } from "@/types/list";

export function ListGrid({
  lists,
  onListClick,
  onEdit,
  onPublishToggle,
  onDelete,
}: ListGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {lists.map((list) => (
        <ListCard
          key={list.id}
          list={list}
          onClick={onListClick}
          onEdit={onEdit}
          onPublishToggle={onPublishToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
