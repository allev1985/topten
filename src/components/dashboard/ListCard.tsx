"use client";

import Image from "next/image";
import {
  MoreVertical,
  Edit,
  Copy,
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
import type { ListCardProps } from "@/types/list";

export function ListCard({ list, onClick }: ListCardProps) {
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
    console.log("Edit list:", list.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Duplicate list:", list.id);
  };

  const handlePublishToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(
      list.isPublished ? "Unpublish list:" : "Publish list:",
      list.id
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${list.title}"?`
    );
    if (confirmed) {
      console.log("Delete list:", list.id);
    }
  };

  const handleViewPublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("View public page:", list.id);
  };

  return (
    <Card
      className="focus:ring-ring cursor-pointer transition-shadow hover:shadow-lg focus:ring-2 focus:outline-none"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View list: ${list.title}. Status: ${statusText}. Contains ${list.placeCount} ${placeText}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          {/* Hero Image */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
            <Image
              src={list.heroImageUrl}
              alt={`${list.title} cover image`}
              fill
              className="object-cover"
            />
          </div>

          {/* Menu Button - Positioned absolutely in top-right */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-background/90 h-8 w-8 backdrop-blur-sm"
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
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate List
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
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold">
            {list.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {list.placeCount} {placeText}
            </span>
            <Badge variant={statusVariant}>{statusText}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
