"use client";

import type { JSX } from "react";
import { useActionState, useEffect, useState } from "react";
import { createListAction } from "@/actions/list-actions";
import type { CreateListSuccessData } from "@/actions/list-actions";
import type { ActionState } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/shared/TagInput";

interface CreateListFormProps {
  /** Called when the list is successfully created */
  onSuccess?: () => void;
}

const initialState: ActionState<CreateListSuccessData> = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
};

/**
 * Create List form
 *
 * Uses useActionState to wire createListAction.
 * Submit is disabled when title is empty or while pending.
 * Calls onSuccess() after a successful creation so the parent can
 * close the dialog and trigger a refresh.
 */
export function CreateListForm({
  onSuccess,
}: CreateListFormProps): JSX.Element {
  const [state, formAction, isPending] = useActionState(
    createListAction,
    initialState
  );

  const [title, setTitle] = useState("");

  // Notify parent on success
  useEffect(() => {
    if (state.isSuccess) {
      onSuccess?.();
    }
  }, [state.isSuccess, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Form-level error */}
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="create-title">Title</Label>
        <Input
          id="create-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Top 10 coffee shops in London"
          maxLength={255}
          required
          aria-describedby={
            state.fieldErrors.title ? "create-title-error" : undefined
          }
        />
        {state.fieldErrors.title && (
          <p
            id="create-title-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      <TagInput
        name="tags"
        disabled={isPending}
        error={state.fieldErrors.tags?.[0]}
      />

      <Button
        type="submit"
        disabled={isPending || !title.trim()}
        className="w-full"
      >
        {isPending ? "Creating…" : "Create List"}
      </Button>
    </form>
  );
}
