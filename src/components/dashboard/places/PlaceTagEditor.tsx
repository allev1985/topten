"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/styling/cn";
import { setPlaceTagsAction, searchTagsAction } from "@/actions/tag-actions";
import { normaliseTagLabel } from "@/lib/tag/helpers/slug";
import { config } from "@/lib/config/client";
import type { TagSummary } from "@/lib/tag";

interface PlaceTagEditorProps {
  placeId: string;
  initialTags: string[];
}

/**
 * Inline tag editor for a place card.
 *
 * Shows current tags as removable badges. Clicking × removes immediately.
 * Typing in the input queries the tag vocabulary for suggestions; selecting
 * one or pressing Enter on free text adds the tag immediately.
 * Both operations call setPlaceTagsAction with the full updated tag set.
 */
export function PlaceTagEditor({ placeId, initialTags }: PlaceTagEditorProps) {
  const [tags, setTags] = useState(initialTags);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagSummary[]>([]);
  const [active, setActive] = useState(-1);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, startSearch] = useTransition();
  const [isSaving, startSave] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useRef(`pte-${placeId}`).current;

  const atCapacity = tags.length >= config.tags.maxPerEntity;

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setActive(-1);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const res = await searchTagsAction(query);
        if (res.isSuccess && res.data) {
          const lower = tags.map((t) => t.toLowerCase());
          setSuggestions(
            res.data.results.filter(
              (t) => !lower.includes(t.label.toLowerCase())
            )
          );
          setActive(-1);
        }
      });
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function applyTags(nextTags: string[], prevTags: string[]) {
    setSaveError(null);
    setTags(nextTags);
    const formData = new FormData();
    formData.set("entityId", placeId);
    formData.set("tags", JSON.stringify(nextTags));
    startSave(async () => {
      const res = await setPlaceTagsAction(
        { data: null, error: null, fieldErrors: {}, isSuccess: false },
        formData
      );
      if (!res.isSuccess) {
        setTags(prevTags);
        setSaveError(res.error ?? "Failed to save tags.");
      }
    });
  }

  function commit(raw: string) {
    const clean = normaliseTagLabel(raw);
    if (!clean || atCapacity) return;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setQuery("");
      setSuggestions([]);
      return;
    }
    setQuery("");
    setSuggestions([]);
    setActive(-1);
    applyTags([...tags, clean], tags);
  }

  function removeTag(label: string) {
    setSuggestions([]);
    applyTags(
      tags.filter((t) => t !== label),
      tags
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(
        active >= 0 && suggestions[active] ? suggestions[active].label : query
      );
    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActive(-1);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1">
        {tags.map((label) => (
          <Badge key={label} variant="secondary" className="gap-1 pr-1 text-xs">
            {label}
            <button
              type="button"
              onClick={() => removeTag(label)}
              disabled={isSaving}
              aria-label={`Remove ${label}`}
              className="hover:text-destructive ml-0.5 opacity-60 hover:opacity-100 disabled:pointer-events-none"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {!atCapacity && (
          <input
            ref={inputRef}
            id={`${uid}-input`}
            type="text"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-haspopup="listbox"
            aria-controls={`${uid}-listbox`}
            aria-activedescendant={
              active >= 0 ? `${uid}-option-${active}` : undefined
            }
            aria-label="Add a tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              // short delay so suggestion clicks register before blur
              setTimeout(() => setSuggestions([]), 150);
            }}
            disabled={isSaving}
            placeholder="Add tag…"
            maxLength={config.tags.maxLabelLength}
            className="text-muted-foreground placeholder:text-muted-foreground/50 h-5 max-w-[120px] min-w-[60px] border-none bg-transparent text-xs outline-none disabled:opacity-50"
          />
        )}
      </div>

      {saveError && (
        <p role="alert" className="text-destructive mt-1 text-xs">
          {saveError}
        </p>
      )}

      {suggestions.length > 0 && (
        <ul
          role="listbox"
          id={`${uid}-listbox`}
          aria-label="Tag suggestions"
          className="bg-popover border-input absolute top-full left-0 z-10 mt-1 max-h-40 w-48 overflow-auto rounded-md border shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              id={`${uid}-option-${i}`}
              aria-selected={i === active}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => commit(s.label)}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-xs",
                  "hover:bg-accent hover:text-accent-foreground",
                  i === active && "bg-accent text-accent-foreground"
                )}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
