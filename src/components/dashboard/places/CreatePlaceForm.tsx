"use client";

import type { JSX } from "react";
import { useState, useRef, useCallback, useActionState, useEffect } from "react";
import {
  createPlaceAction,
  searchPlacesAction,
  resolveGooglePlacePhotoAction,
} from "@/actions/place-actions";
import type { CreatePlaceSuccessData } from "@/actions/place-actions";
import type { GooglePlaceResult } from "@/lib/services/google-places";
import type { ActionState } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  // ── Search state ──────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GooglePlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Selection state ───────────────────────────────────────────────
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceResult | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [isResolvingPhoto, setIsResolvingPhoto] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const searchIdRef = useRef(0);

  // ── Unmount cleanup ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Form action ───────────────────────────────────────────────────
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

  // ── Search handlers ───────────────────────────────────────────────
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSearchError(null);

      // Clear the selection if the user edits the query
      if (selectedPlace) {
        setSelectedPlace(null);
        setHeroImageUrl(null);
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        const id = ++searchIdRef.current;
        setIsSearching(true);
        const result = await searchPlacesAction(value);
        if (!mountedRef.current || searchIdRef.current !== id) return;
        setIsSearching(false);
        if (result.isSuccess && result.data) {
          setSuggestions(result.data.results);
          setShowSuggestions(true);
        } else {
          setSearchError(result.error ?? "Search failed.");
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    },
    [selectedPlace]
  );

  const handleSelectPlace = useCallback(async (place: GooglePlaceResult) => {
    setSelectedPlace(place);
    setQuery(place.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);

    if (place.photoResourceName) {
      setIsResolvingPhoto(true);
      const photoResult = await resolveGooglePlacePhotoAction(
        place.photoResourceName
      );
      if (!mountedRef.current) return;
      setIsResolvingPhoto(false);
      if (photoResult.isSuccess && photoResult.data) {
        setHeroImageUrl(photoResult.data.photoUri);
      }
    }
  }, []);

  const handleClearSelection = () => {
    setSelectedPlace(null);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setHeroImageUrl(null);
    setDescription("");
    setSearchError(null);
  };

  const canSubmit = !!selectedPlace && !isPending && !isResolvingPhoto;

  return (
    <form action={formAction} className="space-y-4">
      {listId && <input type="hidden" name="listId" value={listId} />}

      {/* Hidden fields — populated once a place is selected */}
      {selectedPlace && (
        <>
          <input
            type="hidden"
            name="googlePlaceId"
            value={selectedPlace.googlePlaceId}
          />
          <input type="hidden" name="name" value={selectedPlace.name} />
          <input
            type="hidden"
            name="address"
            value={selectedPlace.formattedAddress}
          />
          <input
            type="hidden"
            name="latitude"
            value={String(selectedPlace.latitude)}
          />
          <input
            type="hidden"
            name="longitude"
            value={String(selectedPlace.longitude)}
          />
          {heroImageUrl && (
            <input type="hidden" name="heroImageUrl" value={heroImageUrl} />
          )}
        </>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      {/* Search input */}
      <div className="relative space-y-2">
        <Label htmlFor="place-search">Search for a place</Label>
        <div className="flex gap-2">
          <Input
            id="place-search"
            autoComplete="off"
            placeholder="e.g. The Coffee House, London"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            disabled={isPending || !!selectedPlace}
          />
          {selectedPlace && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              disabled={isPending}
              aria-label="Clear selection and search again"
            >
              Change
            </Button>
          )}
        </div>
        {isSearching && (
          <p className="text-muted-foreground text-xs">Searching…</p>
        )}
        {searchError && (
          <p className="text-destructive text-xs" role="alert">
            {searchError}
          </p>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul
            role="listbox"
            aria-label="Place suggestions"
            className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border shadow-md"
          >
            {suggestions.map((place) => (
              <li key={place.googlePlaceId} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
                  onClick={() => handleSelectPlace(place)}
                >
                  <span className="font-medium">{place.name}</span>
                  <span className="text-muted-foreground ml-1 text-xs">
                    {place.formattedAddress}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected place summary (read-only) */}
      {selectedPlace && (
        <div className="rounded-md border p-3 space-y-1">
          <p className="text-sm font-medium">{selectedPlace.name}</p>
          <p className="text-muted-foreground text-sm">
            {selectedPlace.formattedAddress}
          </p>
          {isResolvingPhoto && (
            <p className="text-muted-foreground text-xs">Fetching photo…</p>
          )}
        </div>
      )}

      {/* Notes — optional, only shown after a place is selected */}
      {selectedPlace && (
        <div className="space-y-2">
          <Label htmlFor="place-description">
            Notes{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="place-description"
            name="description"
            placeholder="Add your notes about this place…"
            maxLength={2000}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
          />
          {state.fieldErrors["description"] && (
            <p className="text-destructive text-xs">
              {state.fieldErrors["description"]?.[0]}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? "Creating…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

