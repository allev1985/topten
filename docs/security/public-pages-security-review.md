# Security Review: Public Profile and List Pages

**Feature branch:** `feature/public-profile-list-pages`
**Review date:** 2026-03-11
**Reviewer role:** Security Architect (DevSecOps review)
**Scope:** Public profile pages (`/@{vanitySlug}`) and public list pages (`/@{vanitySlug}/{listSlug}`)

---

## Executive Summary

The public pages feature is generally well-implemented with a sound separation between authenticated and public data paths. The service layer correctly scopes queries, soft-delete filtering is consistently applied, and no user-controlled content is rendered unsafely. There are no injection vulnerabilities.

One **High** severity finding requires a fix before merging: the `heroImageUrl` and `avatarUrl` fields originate from Google Places API responses and user profile data respectively, but `next.config.ts` only allowed images from `placehold.co` (a dev-only placeholder domain). In production, Next.js Image Optimization would have blocked all real avatar and place images because no production-safe `remotePatterns` entries were configured. Beyond the functional breakage, this configuration gap means that if a real domain were naively added as a wildcard (e.g., `hostname: '*'`), it would open an SSRF vector through the Next.js image proxy. **This finding has been fixed directly in `next.config.ts`.**

One **Medium** severity finding covers the absence of slug input sanitisation in log statements, which carries a low-risk log injection surface. One **Low** and two **Info** findings round out the report.

No hardcoded secrets, no `dangerouslySetInnerHTML` usage, and no authentication bypass were found.

---

## Findings

### Finding 1 — SSRF Risk: Missing Production `remotePatterns` for Image Domains

**Severity:** High
**Status:** Fixed — `next.config.ts` updated
**Domain:** SSRF / Server-Side Request Forgery

**Description:**
`next/image` proxies external images through the Next.js image optimisation endpoint (`/_next/image`). Without a correctly scoped `remotePatterns` configuration, the image optimiser either rejects all external URLs (causing broken images in production) or, if a developer later adds an overly broad pattern (e.g., a wildcard hostname) to fix the breakage, becomes an SSRF vector that can proxy arbitrary external URLs through the server.

The original `next.config.ts` defined only one entry for `placehold.co` (a dev placeholder). Two components pass DB-sourced URLs directly to `next/image`:
- `ProfileHeader.tsx` line 34: `<Image src={avatarUrl} ...>` — sourced from `users.avatar_url` (VARCHAR 2048)
- `PublicPlaceCard.tsx` line 37: `<Image src={place.heroImageUrl} ...>` — sourced via `COALESCE(list_places.hero_image_url, places.hero_image_url)`

The `heroImageUrl` values for places are populated by the Google Places API. Google serves place photos from `maps.googleapis.com`, `lh3.googleusercontent.com`, and `streetviewpixels-pa.googleapis.com`. Without those domains in `remotePatterns`, every place card image was broken in production.

The SSRF risk would materialise if the fix had been applied with a wildcard (e.g., `hostname: '*'`). The fix applied uses explicit hostnames with scoped pathnames.

**Fix applied:**
`remotePatterns` in `next.config.ts` now includes:
- `maps.googleapis.com` scoped to `/maps/api/place/photo**`
- `lh3.googleusercontent.com` scoped to `/photos/**`
- `streetviewpixels-pa.googleapis.com` scoped to `/**`

---

### Finding 2 — Slug Parameters Logged Without Sanitisation (Log Injection)

**Severity:** Medium
**Status:** Open — not yet fixed
**Domain:** Input Validation / Log Injection

**Description:**
User-controlled route parameters `vanitySlug` and `listSlug` are interpolated directly into `console.info` / `console.error` log messages in `src/lib/public/service.ts` without sanitisation:

```ts
// service.ts line 44-45
`Fetching public profile for slug "${vanitySlug}"`

// service.ts line 168
`Fetching list detail for user ${userId}, slug "${listSlug}"`
```

If logs are shipped to an aggregator that parses line-by-line (e.g., CloudWatch Logs Insights, Datadog), a slug value of `legitimate-slug"\n[ERROR] Fake error injected by attacker` would produce a synthetic log line in the aggregator. This is a low-probability but zero-effort attack that can pollute audit trails and trigger false alerts.

**Recommendation:**
Strip or escape newline characters from slug values before logging. A one-line helper is sufficient:

```ts
const safe = (s: string) => s.replace(/[\r\n]/g, '_');
console.info(`Fetching public profile for slug "${safe(vanitySlug)}"`);
```

Alternatively, adopt structured logging (`JSON.stringify({ slug: vanitySlug })`) so the value is always a JSON string literal and newlines are automatically escaped.

---

### Finding 3 — ISR `revalidate` Export Not Configured on Public Pages

**Severity:** Low
**Status:** Open — not yet fixed
**Domain:** Cache Behaviour / DoS Risk

**Description:**
The feature brief states that the pages should use ISR (`revalidate = 60`), and this is mentioned as a DoS mitigation (cached pages do not hit the DB on every request). However, neither `src/app/profiles/[vanitySlug]/page.tsx` nor `src/app/profiles/[vanitySlug]/[listSlug]/page.tsx` exports a `revalidate` constant.

Without `export const revalidate = 60`, Next.js defaults to **dynamic rendering** for these Server Components (because they call `notFound()` and read params). Every request to a public profile or list page will trigger a fresh DB query. For an unauthenticated public endpoint, this means a sustained burst of requests to `/@popular-creator` will produce an equivalent burst of `SELECT` queries against Postgres.

This is not a security vulnerability in itself, but it removes the DB-shielding that ISR is expected to provide and is a required pre-production correctness issue.

**Recommendation:**
Add `export const revalidate = 60;` to both page files. The `revalidatePublicPaths()` helper in `list-actions.ts` already calls `revalidatePath()` on publish/unpublish, which correctly busts the ISR cache on content changes.

---

### Finding 4 — `PublicProfile` Exposes Internal UUID to Public Callers (Info)

**Severity:** Info
**Status:** Open — recommendation only
**Domain:** Sensitive Data Exposure / Principle of Least Privilege

**Description:**
`PublicProfile` (defined in `src/lib/public/service/types.ts` line 9-15) includes the `id` field (the user's internal UUID):

```ts
export interface PublicProfile {
  id: string;      // internal UUID exposed
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  vanitySlug: string;
}
```

The `id` is not rendered in any component and is used only internally (passed to `getPublicListsForProfile(profile.id)` within the same Server Component). However, because the type is exported and the `id` field is present in the object, any future developer who serialises this type to a Client Component or includes it in an API response will inadvertently expose the internal UUID. Internal UUIDs are not secret, but they enable cross-referencing with any other system or future endpoint that accepts a user UUID.

**Recommendation:**
Consider splitting the type into an internal variant (`ProfileWithId`) used only within the service module, and a `PublicProfile` type without `id` that is safe to pass to components. This is a defence-in-depth measure for long-term maintainability.

---

### Finding 5 — `/profiles/` Internal Path Is Directly Accessible (Info)

**Severity:** Info
**Status:** Open — recommendation only
**Domain:** URL Rewrite / Information Disclosure

**Description:**
The `next.config.ts` rewrites map `/@{vanitySlug}` to `/profiles/{vanitySlug}`. However, the `/profiles/[vanitySlug]` route is a real Next.js page segment, which means `/profiles/alice` is also accessible directly — it does not redirect to `/@alice`. This is not a security vulnerability, but it creates two public URLs for the same content, which can cause:

- Duplicate content in search indexing (SEO concern)
- Ambiguity about canonical URLs
- The possibility of bypassing any future rate limiting or WAF rules written against `/@` patterns only

**Recommendation:**
Add a redirect rule in `next.config.ts` from `/profiles/:vanitySlug` to `/@:vanitySlug` (and the same for list pages), or add a `canonical` meta tag in the layout pointing to the `/@` form. Alternatively, and more robustly, rename the file-system route to use a non-guessable internal prefix (e.g., `__profiles__`) that is less likely to be accessed directly.

---

## Verified Controls

The following security-relevant properties were explicitly verified in the reviewed code:

1. **Soft-delete filtering is applied consistently on all three queries in `service.ts`.**
   - `getPublicProfile`: `isNull(users.deletedAt)` on line 57
   - `getPublicListsForProfile`: `isNull(lists.deletedAt)` and `isNull(listPlaces.deletedAt)` on lines 115 and 121
   - `getPublicListDetail` list header query: `isNull(lists.deletedAt)` on line 188
   - `getPublicListDetail` places query: `isNull(listPlaces.deletedAt)` and `isNull(places.deletedAt)` on lines 215-217

2. **Unpublished lists are never served.** `eq(lists.isPublished, true)` is present in both `getPublicListsForProfile` (line 121) and `getPublicListDetail` (line 187). The unit tests in `public-service.test.ts` verify this path.

3. **No SQL injection risk.** All queries use Drizzle ORM's parameterised query builder throughout. The `vanitySlug` and `listSlug` route params are passed as bound values via `eq(column, value)`, never interpolated into raw SQL.

4. **No XSS via `dangerouslySetInnerHTML`.** All five public components (`ProfileHeader`, `PublicListCard`, `PublicListGrid`, `PublicPlaceCard`, `PublicPlaceList`) render user-controlled content (name, bio, title, description, address) exclusively through JSX text nodes, which React escapes by default.

5. **User bio and place descriptions are plain text strings.** The schema defines `bio` as `text` and place `description` as `text` with no HTML stored or expected. There is no Markdown or rich-text renderer in the public components.

6. **No IDOR on list detail.** `getPublicListDetail` takes a `userId` derived from the profile lookup (i.e., the slug owner's UUID, not a URL-supplied UUID), scoping the list query to `eq(lists.userId, userId)`. An attacker cannot access another user's list by manipulating the list slug alone.

7. **URL rewrite does not introduce path traversal.** The `source` patterns `/@:vanitySlug` and `/@:vanitySlug/:listSlug` match only the literal `@` prefix; segments like `/@../admin` are structurally invalid in Next.js URL matching and would not match these patterns. Next.js normalises paths before rewrite matching, preventing `../` traversal.

8. **Protected routes are unaffected.** `PROTECTED_ROUTES = ["/dashboard", "/settings"]`. The rewrite destinations (`/profiles/*`) are not in this list and are not a prefix of it. The proxy middleware (`src/proxy.ts`) correctly handles: public-route -> session refresh only; protected-route -> auth check; everything else -> pass through. The public profile routes fall into the "everything else" bucket and are correctly allowed through unauthenticated.

9. **No hardcoded secrets or API keys** were found in any of the reviewed files.

10. **`revalidatePublicPaths` does not expose data.** The helper in `list-actions.ts` only calls `revalidatePath()` — it does not return or forward any data. It is correctly fire-and-forget with swallowed errors so revalidation failures never block the action response.

11. **`React.cache` deduplication is correctly applied.** `getPublicProfile` is wrapped in `cache()`, so the layout, `generateMetadata`, and page all share a single DB round-trip per request. The test suite correctly mocks `react.cache` as a pass-through.

12. **Ownership scoping in `revalidatePublicPaths` is safe.** The function derives `vanitySlug` by querying the DB for the authenticated `userId` (from `requireAuth()`), not from user-supplied form input. The revalidation paths constructed from this data cannot be manipulated by the calling client.

---

## Required Fixes Before Merging

| # | Severity | File | Summary | Status |
|---|----------|------|---------|--------|
| 1 | High | `next.config.ts` | Add Google image domains to `remotePatterns` | **Fixed** |
| 2 | Low | `src/app/profiles/[vanitySlug]/page.tsx` | Add `export const revalidate = 60` | Open |
| 3 | Low | `src/app/profiles/[vanitySlug]/[listSlug]/page.tsx` | Add `export const revalidate = 60` | Open |

---

## Recommended Improvements

1. **Log injection mitigation (Medium):** Sanitise `vanitySlug` and `listSlug` before embedding them in log strings (see Finding 2). Apply `s.replace(/[\r\n]/g, '_')` or switch to structured JSON logging.

2. **Gate `placehold.co` to non-production (Low):** Wrap the `placehold.co` `remotePatterns` entry in a conditional so it is not active in production builds.

3. **Canonical URL redirect (Info):** Add a redirect from `/profiles/:slug` to `/@:slug` in `next.config.ts` to enforce the canonical URL form and prevent dual-indexing.

4. **Internal UUID in `PublicProfile` type (Info):** Consider splitting the type into an internal variant that carries `id` and an exported `PublicProfile` that does not, as a defence-in-depth measure.

5. **Test coverage gap — ISR not tested:** There are no integration tests verifying that `revalidatePublicPaths` correctly busts the cache after a publish/unpublish cycle. Consider adding a test that mocks `revalidatePath` and asserts it is called with the correct `/@{slug}` paths.

6. **Test coverage gap — `/profiles/` direct URL not 404'd or redirected:** There is no test asserting that `/profiles/alice` either redirects to `/@alice` or renders the same content with the correct canonical tag. Adding this would lock down the dual-URL behaviour explicitly.
