"use client";

import { useFormState } from "@/hooks/use-form-state";
import { updateNameAction } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface NameSettingsFormProps {
  /** The user's current display name */
  initialName: string;
}

/**
 * Form section for updating the user's display name.
 * Provides inline validation and feedback without page navigation.
 */
export function NameSettingsForm({ initialName }: NameSettingsFormProps) {
  const { state, formAction } = useFormState(updateNameAction);

  // Reflect the latest saved value on success, otherwise use the initial prop.
  const currentName = state.isSuccess && state.data ? state.data.name : initialName;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your display name</CardDescription>
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
              <AlertDescription role="status" aria-label="Name updated successfully.">
                Name updated successfully.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={currentName}
              placeholder="Your display name"
              autoComplete="name"
              aria-invalid={state.fieldErrors.name?.[0] ? "true" : undefined}
              aria-describedby={
                state.fieldErrors.name?.[0] ? "name-error" : undefined
              }
            />
            {state.fieldErrors.name?.[0] && (
              <span
                id="name-error"
                role="alert"
                aria-label={state.fieldErrors.name[0]}
                className="text-destructive text-sm"
              >
                {state.fieldErrors.name[0]}
              </span>
            )}
          </div>

          <Button type="submit" disabled={state.isPending}>
            {state.isPending ? "Saving…" : "Save Name"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
