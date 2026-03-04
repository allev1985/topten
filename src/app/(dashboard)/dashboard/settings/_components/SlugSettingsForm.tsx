"use client";

import { useFormState } from "@/hooks/use-form-state";
import { updateSlugAction } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SlugSettingsFormProps {
  /** The user's current vanity slug */
  initialSlug: string;
}

/**
 * Form section for updating the user's vanity slug (Profile URL).
 * Provides inline validation and feedback without page navigation.
 */
export function SlugSettingsForm({ initialSlug }: SlugSettingsFormProps) {
  const { state, formAction } = useFormState(updateSlugAction);

  // The displayed slug reflects the latest saved value on success,
  // otherwise falls back to the initial prop from the server.
  const currentSlug = state.isSuccess && state.data ? state.data.vanitySlug : initialSlug;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile URL</CardTitle>
        <CardDescription>
          Customise the URL for your public lists page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state.isSuccess && (
            <Alert>
              <AlertDescription role="status" aria-label="Profile URL updated successfully.">
                Profile URL updated successfully.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="vanitySlug">Your profile URL</Label>
            <Input
              key={currentSlug}
              id="vanitySlug"
              name="vanitySlug"
              type="text"
              defaultValue={currentSlug}
              placeholder="your-unique-handle"
              autoComplete="off"
              aria-invalid={
                state.fieldErrors.vanitySlug?.[0] ? "true" : undefined
              }
              aria-describedby={
                state.fieldErrors.vanitySlug?.[0]
                  ? "vanitySlug-error"
                  : "vanitySlug-hint"
              }
            />
            <p id="vanitySlug-hint" className="text-muted-foreground text-sm">
              Your public page:{" "}
              <span className="font-mono">/{currentSlug}</span>
            </p>
            {state.fieldErrors.vanitySlug?.[0] && (
              <span
                id="vanitySlug-error"
                role="alert"
                aria-label={state.fieldErrors.vanitySlug[0]}
                className="text-destructive text-sm"
              >
                {state.fieldErrors.vanitySlug[0]}
              </span>
            )}
          </div>

          <Button type="submit" disabled={state.isPending}>
            {state.isPending ? "Saving…" : "Save Profile URL"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        <p>
          Only lowercase letters, numbers, and hyphens. Must start and end with
          a letter or number.
        </p>
      </CardFooter>
    </Card>
  );
}
