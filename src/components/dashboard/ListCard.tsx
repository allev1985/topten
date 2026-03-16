"use client";

import { useState } from "react";
import {
  MoreVertical,
  Edit,
  Eye,
  Upload,
  Download,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ListCardProps } from "@/types/list";

export function ListCard({
  list,
  onClick,
  onEdit,
  onPublishToggle,
  onDelete,
}: ListCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const placeText = list.placeCount === 1 ? "place" : "places";
  const statusVariant = list.isPublished ? "default" : "secondary";
  const statusText = list.isPublished ? "Published" : "Draft";

  const handleCardClick = () => {
    onClick(list.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(list.id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(list.id);
  };

  const handlePublishToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPublishToggle?.(list.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete?.(list.id);
  };

  const handleViewPublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: navigate to public list page once implemented
    console.log("View public page:", list.id);
  };

  return (
    <>
      <Card
        className="focus:ring-ring cursor-pointer transition-shadow hover:shadow-lg focus:ring-2 focus:outline-none"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View list: ${list.title}. Status: ${statusText}. Contains ${list.placeCount} ${placeText}`}
      >
        <CardContent className="p-0">
          <div className="p-4">
            {/* Header row: title + menu */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-lg leading-snug font-semibold">
                {list.title}
              </h3>

              {/* Menu Button */}
              <div className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Options for ${list.title}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePublishToggle}>
                      {list.isPublished ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    {list.isPublished && (
                      <DropdownMenuItem onClick={handleViewPublic}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Public Page
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteClick}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Description */}
            {list.description && (
              <p className="text-muted-foreground mt-1 mb-3 line-clamp-2 text-sm">
                {list.description}
              </p>
            )}

            {/* Footer: place count + status badge */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {list.placeCount} {placeText}
              </span>
              <Badge variant={statusVariant}>{statusText}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{list.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This list will be permanently deleted and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
