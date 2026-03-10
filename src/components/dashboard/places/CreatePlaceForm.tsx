"use client";

import type { JSX } from "react";
import { useState, useActionState, useEffect } from "react";
import { createPlaceAction } from "@/actions/place-actions";
import type { CreatePlaceSuccessData } from "@/actions/place-actions";
import type { ActionState } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreatePlaceFormProps {
  /** When provided, the new place is attached to this list. Omit for standalone. */
  listId?: string;
  onSuccess: () => void;
  onCancel: () => void;
  /** Label for the submit button. Defaults to "Add place". */
  submitLabel?: string;
  /** Called whenever the pending state changes — useful for parent dialogs that
   *  need to suppress outside-click dismissal while a submit is in flight. */
  onPendingChange?: (isPending: boolean) => void;
}

const buildInitialState = (): ActionState<CreatePlaceSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

export function CreatePlaceForm({
  listId,
  onSuccess,
  onCancel,
  submitLabel = "Add place",
  onPendingChange,
}: CreatePlaceFormProps): JSX.Element {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [state, formAction, isPending] = useActionState(
    createPlaceAction,
    buildInitialState()
  );

  useEffect(() => {
    if (state.isSuccess) onSuccess();
  }, [state.isSuccess, onSuccess]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  return (
    <form action={formAction} className="space-y-4">
      {listId && <input type="hidden" name="listId" value={listId} />}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="place-name">Name</Label>
        <Input
          id="place-name"
          name="name"
          placeholder="e.g. The Coffee House"
          maxLength={255}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
        {state.fieldErrors["name"] && (
          <p className="text-destructive text-xs">
            {state.fieldErrors["name"]?.[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="place-address">Address</Label>
        <Input
          id="place-address"
          name="address"
          placeholder="e.g. 1 Main St, London"
          maxLength={500}
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isPending}
        />
        {state.fieldErrors["address"] && (
          <p className="text-destructive text-xs">
            {state.fieldErrors["address"]?.[0]}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !name.trim() || !address.trim()}
        >
          {isPending ? "Creating…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
