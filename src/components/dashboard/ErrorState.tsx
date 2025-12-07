import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Error state component with retry functionality
 * Displayed when list loading fails
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load lists</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">
            {error.message || "We couldn't load your lists. Please try again."}
          </p>
          <Button onClick={onRetry} variant="outline" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
