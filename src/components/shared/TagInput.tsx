"use client";

import type { JSX } from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { TagBadge } from "./TagBadge";
import { searchTagsAction } from "@/actions/tag-actions";
import type { TagSummary } from "@/lib/tag/types";

/** Props for the TagInput component */
interface TagInputProps {
  /** Currently selected tag names */
  value: string[];
  /** Called when tags change */
  onChange: (tags: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Input ID for label association */
  id?: string;
}

/**
 * Tag input with autocomplete and inline tag management.
 * Searches existing tags as the user types, allows creating new custom tags.
 *
 * @param props - Tag input properties
 * @returns Tag input element
 */
export function TagInput({
  value,
  onChange,
  placeholder = "Add tags…",
  maxTags = 20,
  id,
}: TagInputProps): JSX.Element {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagSummary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addTag = useCallback(
    (name: string) => {
      const normalised = name
        .toLowerCase()
        .trim()
        .replace(/[_\s]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!normalised || normalised.length < 2) return;
      if (value.includes(normalised)) return;
      if (value.length >= maxTags) return;

      onChange([...value, normalised]);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightIndex(-1);
    },
    [value, onChange, maxTags]
  );

  const removeTag = useCallback(
    (name: string) => {
      onChange(value.filter((t) => t !== name));
    },
    [value, onChange]
  );

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const result = await searchTagsAction(query);
        if (result.isSuccess && result.data) {
          const filtered = result.data.tags.filter(
            (t) => !value.includes(t.name)
          );
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch {
        // Silently fail — autocomplete is best-effort
      }
    },
    [value]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      setHighlightIndex(-1);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchSuggestions(val);
      }, 250);
    },
    [fetchSuggestions]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIndex >= 0 && suggestions[highlightIndex]) {
          addTag(suggestions[highlightIndex].name);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
      } else if (e.key === "," || e.key === "Tab") {
        if (inputValue.trim()) {
          e.preventDefault();
          addTag(inputValue);
        }
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1]!);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setHighlightIndex(-1);
      }
    },
    [inputValue, suggestions, highlightIndex, value, addTag, removeTag]
  );

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="border-input focus-within:ring-ring flex flex-wrap gap-1 rounded-md border px-3 py-2 focus-within:ring-1">
        {value.map((tag) => (
          <TagBadge key={tag} name={tag} onRemove={() => removeTag(tag)} />
        ))}
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="h-auto min-w-[120px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
          aria-label="Add tag"
          autoComplete="off"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          className="bg-popover border-border absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow-md"
          role="listbox"
        >
          {suggestions.map((tag, idx) => (
            <li
              key={tag.id}
              role="option"
              aria-selected={idx === highlightIndex}
              className={`cursor-pointer px-3 py-2 text-sm ${
                idx === highlightIndex ? "bg-accent" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(tag.name);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              <span>{tag.name}</span>
              {tag.source === "system" && (
                <span className="text-muted-foreground ml-2 text-xs">
                  (system)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
