# Quickstart: Google Places Integration (Local Dev)

**Branch**: `008-google-places-integration`

---

## Prerequisites

- A Google Cloud project with the **Places API (New)** enabled.
- An API key restricted to the Places API (server use only — no HTTP referrer restrictions needed for server-side calls).

---

## 1. Add the API key to your local environment

In the project root, open `.env` (or `.env.local`) and add:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

> **Critical**: do NOT prefix this with `NEXT_PUBLIC_`. It must remain server-side only.

The `.env.example` file should be updated to include:
```bash
GOOGLE_PLACES_API_KEY=
```

---

## 2. Apply the database migration

```bash
pnpm db:migrate
```

This applies the `add_place_google_fields` migration which adds `description` and `hero_image_url` to the `places` table.

To verify locally:
```bash
pnpm db:studio
# or inspect via Supabase Studio at http://localhost:54323
```

---

## 3. Test the integration service in isolation

```bash
pnpm test tests/unit/google-places-service.test.ts
```

All tests use a mocked HTTP layer — no real API calls are made. No API key is required to run unit tests.

---

## 4. Run the full dev server

```bash
pnpm dev
```

Navigate to a list detail page → "Add a place" → type at least 3 characters. Google Places suggestions should appear within ~300 ms. Check the terminal for `[GooglePlacesService]` log lines to confirm server-side calls.

---

## 5. Verify the API key is not in the client bundle

After a production build:

```bash
pnpm build
grep -r "GOOGLE_PLACES_API_KEY" .next/static/ && echo "LEAK FOUND" || echo "OK — key not in bundle"
# Also check the key value itself is absent:
grep -r "your_api_key_here" .next/static/ && echo "LEAK FOUND" || echo "OK"
```

---

## 6. Supabase local setup (if starting fresh)

```bash
supabase start
pnpm db:migrate
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `CONFIGURATION_ERROR` thrown on first search | `GOOGLE_PLACES_API_KEY` env var missing | Add key to `.env` and restart dev server |
| No suggestions shown, no error in UI | Debounce not firing or < 3 chars | Type at least 3 characters |
| `API_ERROR` code in logs | Key invalid or Places API not enabled | Verify key in Google Cloud Console |
| `TIMEOUT` error | Slow network / VPN | Increase timeout in `GooglePlacesService` config for local dev only |
| Photo not shown after selection | `resolveGooglePlacePhotoAction` failed | Check terminal for `[GooglePlacesService:resolvePhotoUri]` error |
