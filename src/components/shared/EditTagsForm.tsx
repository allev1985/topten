"use client";

import { useActionState, useEffect } from "react";
import { setListTagsAction, setPlaceTagsAction } from "@/actions/tag-actions";
import type { SetTagsSuccessData } from "@/actions/tag-actions";
import type { ActionState } from "@/types/forms";
import type { TaggableKind } from "@/lib/tag";
import { Button } from "@/components/ui/button";
import { TagInput } from "./TagInput";

/**
 * Props for {@link EditTagsForm}.
 */
export interface EditTagsFormProps {
  /** The list or place UUID whose tag set is being edited. */
  entityId: string;
  /** Which junction table to write to. */
  kind: TaggableKind;
  /** Current tag labels to pre-populate the input. */
  initialTags: string[];
  /** Called after a successful save. */
  onSuccess?: () => void;
}

const initialState: ActionState<SetTagsSuccessData> = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
};

/**
 * Self-contained form for replacing the tag set on an existing list or place.
 *
 * Dispatches to {@link setListTagsAction} or {@link setPlaceTagsAction} based
 * on `kind`. Designed to be composed alongside the primary edit form inside a
 * dialog — it carries its own submit button and does not interfere with the
 * sibling form's state.
 *
 * @param props - {@link EditTagsFormProps}
 * @returns A tag-editing form
 */
export function EditTagsForm({
  entityId,
  kind,
  initialTags,
  onSuccess,
}: EditTagsFormProps) {
  const action = kind === "list" ? setListTagsAction : setPlaceTagsAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.isSuccess) onSuccess?.();
  }, [state.isSuccess, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="entityId" value={entityId} />

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <TagInput
        name="tags"
        defaultValue={initialTags}
        disabled={isPending}
        error={state.fieldErrors.tags?.[0]}
      />

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save tags"}
        </Button>
      </div>
    </form>
  );
}
