import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton placeholder that matches ListCard structure
 * Displays while list data is being fetched
 */
export function ListCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Hero Image Skeleton - 16:9 aspect ratio */}
      <Skeleton className="aspect-[16/9] w-full" />

      <CardContent className="p-4">
        {/* Title Skeleton */}
        <Skeleton className="mb-2 h-6 w-3/4" />

        {/* Place Count Skeleton */}
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
