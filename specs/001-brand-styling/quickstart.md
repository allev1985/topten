# Quickstart: Brand Styling — myfaves Visual Identity

**Branch**: `001-brand-styling` | **Date**: 2026-03-13

---

## Run Locally

```bash
cd /home/alex/Documents/GitHub/topten
pnpm dev
```

No new npm/pnpm packages are required. Google Fonts are loaded via a `<link>` tag in `layout.tsx`.

Open [http://localhost:3000](http://localhost:3000).

---

## Manual Verification Checklist

Work through each item with browser DevTools open (Chrome/Edge → F12).

### Fonts

- [ ] `document.body` → Computed → `font-family` starts with `DM Sans`
- [ ] Landing `<h1>` → Computed → `font-family` starts with `DM Serif Display`
- [ ] No reference to `Geist` or `Arial` on any visible element

### Colours — Light Mode

- [ ] Page background: `rgb(249, 250, 251)` (`#F9FAFB`)
- [ ] Body text: `rgb(17, 24, 39)` (`#111827`)
- [ ] "Create Your First List" button background: `rgb(139, 92, 246)` (`#8B5CF6`)
- [ ] Tab to any button → focus ring is violet (not black)

### Colours — Dark Mode

Simulate via DevTools → Rendering tab → "Emulate CSS prefers-color-scheme: dark".

- [ ] Body background: `rgb(17, 24, 39)` (`#111827`)
- [ ] Card surfaces: `rgb(31, 41, 55)` (`#1F2937`)
- [ ] "faves" span in wordmark: `rgb(196, 181, 253)` (`#C4B5FD`)

### Wordmark & Branding

- [ ] Browser tab title: **myfaves** (not "YourFavs")
- [ ] Landing header: wordmark shows "my" in near-black + "faves" in violet — no MapPin icon
- [ ] Dashboard sidebar: same two-colour wordmark — no `📍 YourFavs` text
- [ ] Navigate to a public profile page — page title contains "myfaves" not "YourFavs"
- [ ] Navigate to a public list page — page title contains "myfaves" not "YourFavs"

### List Cards

- [ ] Dashboard list cards each show a coloured gradient strip at the top of the card
- [ ] No card shows a plain white or grey cover area
- [ ] Multiple cards in the grid show different gradients (deterministic by list ID)

---

## Run Tests

```bash
# Unit + component tests
pnpm test

# E2E tests (requires dev server running)
pnpm exec playwright test
```

All existing tests must pass. Component tests for `Header` and `DashboardSidebar` should assert on the wordmark markup.

---

## Files Changed (summary)

| File | Change |
|------|--------|
| `src/app/globals.css` | CSS token overhaul; font variables; body font-family |
| `src/app/layout.tsx` | Google Fonts `<link>` tags; metadata title → "myfaves" |
| `src/app/page.tsx` | Metadata title + OG tags → "myfaves" |
| `src/app/profiles/[vanitySlug]/page.tsx` | Page title/description strings → "myfaves" |
| `src/app/profiles/[vanitySlug]/lists/[listSlug]/page.tsx` | Page title/description strings → "myfaves" |
| `src/components/shared/Header.tsx` | Logo: MapPin+text → two-colour wordmark |
| `src/components/dashboard/DashboardSidebar.tsx` | Logo: 📍 YourFavs → two-colour wordmark |
| `src/components/dashboard/ListCard.tsx` | Add gradient cover strip |
| `src/lib/utils/gradient.ts` | New file — `BRAND_GRADIENTS` + `listCoverGradient()` |
