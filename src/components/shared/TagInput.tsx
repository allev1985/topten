"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/styling/cn";
import { searchTagsAction } from "@/actions/tag-actions";
import { config } from "@/lib/config/client";
import { normaliseTagLabel, normaliseTagSlug } from "@/lib/tag/helpers/slug";
import type { TagSummary } from "@/lib/tag";

/**
 * Props for {@link TagInput}.
 */
export interface TagInputProps {
  /** Hidden form-field name — the JSON-encoded tag array is posted under this key. */
  name: string;
  /** Initial tag labels (e.g. from an existing list or place). */
  defaultValue?: string[];
  /** Visual label for the input group. */
  label?: string;
  /** Placeholder shown in the text input. */
  placeholder?: string;
  /** Disable all interaction. */
  disabled?: boolean;
  /** Validation message to surface under the input. */
  error?: string;
}

/**
 * Controlled multi-tag input with server-backed autocomplete.
 *
 * Renders a pill for each selected tag plus a free-text input that queries
 * {@link searchTagsAction} after a short debounce. Users can commit a tag by
 * clicking a suggestion or by pressing Enter / comma on free text. Backspace
 * on an empty input removes the trailing tag.
 *
 * The selected labels are JSON-serialised into a hidden `<input>` so the
 * component is a drop-in form field for server actions that parse
 * `tagsFieldSchema`.
 *
 * @param props - {@link TagInputProps}
 * @returns Interactive tag editor
 */
export function TagInput({
  name,
  defaultValue = [],
  label = "Tags",
  placeholder = "Add a tag…",
  disabled = false,
  error,
}: TagInputProps) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagSummary[]>([]);
  const [active, setActive] = useState(-1);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const atCapacity = selected.length >= config.tags.maxPerEntity;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      setSuggestions([]);
      setActive(-1);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchTagsAction(query);
        if (res.isSuccess && res.data) {
          const lower = selected.map((s) => s.toLowerCase());
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

  function commit(raw: string) {
    const clean = normaliseTagLabel(raw);
    if (!clean || !normaliseTagSlug(raw) || atCapacity) return;
    if (selected.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setQuery("");
      setSuggestions([]);
      return;
    }
    setSelected((prev) => [...prev, clean]);
    setQuery("");
    setSuggestions([]);
    setActive(-1);
  }

  function remove(idx: number) {
    setSelected((prev) => prev.filter((_, i) => i !== idx));
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (active >= 0 && suggestions[active]) {
        commit(suggestions[active].label);
      } else {
        commit(query);
      }
    } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
      remove(selected.length - 1);
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
    <div className="space-y-1.5">
      <label htmlFor={`${name}-tag-input`} className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1 text-xs font-normal">
          ({selected.length}/{config.tags.maxPerEntity})
        </span>
      </label>
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
      <div
        className={cn(
          "border-input flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 text-sm shadow-xs",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          disabled && "pointer-events-none opacity-50",
          error && "border-destructive"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((tag, i) => (
          <Badge key={`${tag}-${i}`} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
              className="hover:text-destructive rounded-full"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {!atCapacity && (
          <input
            ref={inputRef}
            id={`${name}-tag-input`}
            type="text"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-haspopup="listbox"
            aria-controls={`${name}-listbox`}
            aria-activedescendant={
              active >= 0 ? `${name}-option-${active}` : undefined
            }
            aria-describedby={error ? `${name}-error` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (query.trim()) commit(query);
            }}
            placeholder={selected.length === 0 ? placeholder : ""}
            maxLength={config.tags.maxLabelLength}
            disabled={disabled}
            className="placeholder:text-muted-foreground min-w-[8rem] flex-1 bg-transparent outline-none"
          />
        )}
      </div>
      {suggestions.length > 0 && (
        <ul
          role="listbox"
          id={`${name}-listbox`}
          aria-label="Tag suggestions"
          className="bg-popover border-input max-h-48 overflow-auto rounded-md border shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              id={`${name}-option-${i}`}
              aria-selected={i === active}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => commit(s.label)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  i === active && "bg-accent text-accent-foreground"
                )}
              >
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-destructive text-xs"
        >
          {error}
        </p>
      )}
    </div>
  );
}
