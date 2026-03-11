# Public Profiles and Public List Pages

## Status: Defined — not yet implemented

---

## 1. Feature Overview

### Problem Statement

YourFavs allows creators to build and publish lists of their favourite places, but currently there is no way for anyone — including the creator themselves — to view this content as a public visitor. Published lists exist in the database but are unreachable from any URL. The platform's core value proposition (sharing curated recommendations with others) is entirely blocked until public-facing routes exist.

### What This Feature Delivers

This feature introduces two new public routes:

- `/@{vanity_slug}` — A creator's public profile page listing all their published lists
- `/@{vanity_slug}/{list-slug}` — A public page displaying all places within a specific published list

These routes require no authentication to access. They are the primary surfaces through which the platform's content is consumed and shared.

### Who It Is For

- **Creators** who want to share their curated recommendations with friends, followers, or the public via a clean, memorable URL
- **Visitors** (authenticated or not) who have received a link and want to browse a creator's lists or a specific list

---

## 2. User Personas

### Persona A: The List Creator

A registered YourFavs user who has built one or more lists of places (e.g. "Best coffee in Edinburgh", "My favourite Tokyo ramen"). They publish lists when they are ready to share and want to hand people a single link to their profile or a specific list. They may share links on social media, in a bio, or via direct message.

Key needs:
- A shareable profile URL that shows all their published work
- A shareable list URL that shows a specific curated list
- Confidence that unpublished (draft) lists are not visible to visitors
- Meaningful page titles and previews when links are shared on social platforms

### Persona B: The Public Visitor (Unauthenticated)

Someone who has received a link to a YourFavs profile or list — possibly a friend of the creator, a social media follower, or someone who found the link in a bio. They have no YourFavs account and no intention to create one right now. They want to browse the content quickly and without friction.

Key needs:
- Immediate access to the content without being prompted to sign up
- A clear, visually readable layout of the list and its places
- The ability to navigate between a list and the creator's profile

### Persona C: The Authenticated Visitor

A YourFavs user who is browsing another creator's public profile or list while logged in. Their experience of public pages should be identical to Persona B — authentication status must not alter what content is shown on public pages.

Key needs:
- Same content and layout as the unauthenticated visitor
- No confusion between their own dashboard and the public view of another creator's content

---

## 3. User Journeys

### Journey 1: Creator Sharing Their Profile Link

1. Creator logs into YourFavs and navigates to their dashboard.
2. Creator sees their profile URL displayed (e.g. `yourfavs.com/@alex`).
3. Creator copies the link and pastes it into a social media bio, message, or email.
4. Recipient clicks the link and lands on the creator's public profile page.
5. Recipient sees the creator's name, avatar (if set), bio (if set), and a grid/list of published lists.
6. Recipient clicks a list card and is taken to that list's public page.

### Journey 2: Creator Sharing a Specific List Link

1. Creator navigates to a published list in their dashboard.
2. Creator sees the public URL for that list (e.g. `yourfavs.com/@alex/best-coffee-edinburgh`).
3. Creator copies and shares the link directly (e.g. in a message or post).
4. Recipient clicks the link and lands directly on the list page, bypassing the profile.
5. Recipient sees the list title, description, and all places in order.
6. Recipient can navigate back to the creator's profile via a link on the list page.

### Journey 3: Public Visitor Discovering a Profile

1. Visitor arrives at `/@alex` via a shared link.
2. The page loads without requiring authentication.
3. Visitor sees the creator's name, bio (if present), avatar (if present), and a list of published lists.
4. If the creator has no published lists, the visitor sees an appropriate empty state.
5. Visitor clicks a list to view it.
6. If the vanity slug does not exist (or the user has been soft-deleted), the visitor sees a 404 page.

### Journey 4: Public Visitor Browsing a List

1. Visitor arrives at `/@alex/best-coffee-edinburgh` via a shared link.
2. The page loads without requiring authentication.
3. Visitor sees the list title, optional description, and all places in their defined order.
4. Each place shows: its name, address, hero image (if available), and the place description (if set on the Place record).
5. Visitor can see how many places are in the list.
6. Visitor can navigate to the creator's profile page via a link on the page.
7. If the list slug does not exist, is unpublished, or has been soft-deleted, the visitor sees a 404 page.

---

## 4. User Stories

### 4.1 Public Profile Page

**US-01: View a creator's public profile**
As a public visitor, I want to view a creator's profile page at `/@{vanity_slug}` so that I can see who they are and browse all of their published lists.

**US-02: Profile not found**
As a public visitor, I want to see a clear 404 page when I visit a vanity slug that does not exist (or belongs to a deleted account) so that I understand the page is unavailable rather than seeing a blank or broken page.

**US-03: Profile with no published lists**
As a public visitor, I want to see a meaningful empty state when a creator exists but has not published any lists yet so that I understand they have an account but no content is available.

**US-04: Profile page SEO and shareability**
As a creator, I want my profile page to have a meaningful page title, meta description, and Open Graph tags so that when I share the link on social media it renders a useful preview.

### 4.2 Public List Page

**US-05: View a published list**
As a public visitor, I want to view a published list at `/@{vanity_slug}/{list-slug}` so that I can read the creator's curated recommendations.

**US-06: Draft list is not publicly accessible**
As a creator, I want unpublished (draft) lists to return a 404 for public visitors so that I can work on a list privately before it is ready to share.

**US-07: List not found**
As a public visitor, I want to see a clear 404 page when I visit a list URL that does not exist or is unavailable so that I understand the content is not accessible.

**US-08: List page SEO and shareability**
As a creator, I want my list page to have a meaningful page title, meta description, and Open Graph tags derived from the list's title and description so that shared links render a useful preview.

### 4.3 Navigation

**US-09: Navigate from a list back to the creator's profile**
As a public visitor viewing a list, I want a clearly visible link back to the creator's profile page so that I can discover their other published lists without needing to manually edit the URL.

**US-10: Navigate from a profile to a list**
As a public visitor viewing a profile, I want to click on a list card to be taken to that list's public page so that I can browse a specific list.

### 4.4 Content Displayed

**US-11: Place details on a list page**
As a public visitor, I want to see each place's name, address, hero image, and description (if available) on the list page so that I have enough context to act on the recommendation.

**US-12: Place ordering is preserved**
As a public visitor, I want places on a list page to appear in the order defined by the creator (ascending by `position`) so that the creator's intended narrative is preserved.

---

## 5. Acceptance Criteria

### US-01: View a creator's public profile

**Given** a user exists with `vanity_slug = "alex"` and `deleted_at IS NULL`
**When** any visitor (authenticated or not) requests `/@alex`
**Then** the page returns HTTP 200
**And** the page displays: the creator's `name`, `bio` (if not null), `avatar_url` rendered as an image (if not null)
**And** the page displays a list of published lists (`is_published = true`, `deleted_at IS NULL`), each showing the list `title` and `description` (if not null)
**And** unpublished lists (`is_published = false`) are not shown
**And** soft-deleted lists (`deleted_at IS NOT NULL`) are not shown

---

### US-02: Profile not found

**Given** no user exists with the requested `vanity_slug`, OR the matching user has `deleted_at IS NOT NULL`
**When** any visitor requests `/@{vanity_slug}`
**Then** the page returns HTTP 404
**And** the page renders a user-facing 404 message (not a raw error or blank page)

---

### US-03: Profile with no published lists

**Given** a user exists with `vanity_slug = "alex"` and `deleted_at IS NULL`
**And** that user has no lists where `is_published = true` AND `deleted_at IS NULL`
**When** any visitor requests `/@alex`
**Then** the page returns HTTP 200
**And** the creator's profile information (name, bio, avatar) is still displayed
**And** an empty state message is shown in place of the list grid (e.g. "Alex hasn't published any lists yet.")

---

### US-04: Profile page SEO and shareability

**Given** a user with `name = "Alex"` and `vanity_slug = "alex"` and `bio = "My favourite spots around the world"`
**When** the page `/@alex` is rendered
**Then** the HTML `<title>` is set to `"Alex — YourFavs"` (or equivalent)
**And** a `<meta name="description">` tag is present, populated from the user's `bio` (truncated if necessary); if `bio` is null, a generic fallback is used (e.g. "Discover Alex's curated lists on YourFavs")
**And** `og:title`, `og:description`, and `og:url` Open Graph tags are present and correctly populated
**And** `og:image` is set to `avatar_url` if present; otherwise a default YourFavs OG image is used

---

### US-05: View a published list

**Given** a user with `vanity_slug = "alex"` and a list with `slug = "best-coffee-edinburgh"` where `is_published = true` and `deleted_at IS NULL`
**When** any visitor requests `/@alex/best-coffee-edinburgh`
**Then** the page returns HTTP 200
**And** the page displays the list `title` and `description` (if not null)
**And** the page displays all places linked via `ListPlace` where `list_places.deleted_at IS NULL`, ordered ascending by `position`
**And** for each place the page shows: `places.name`, `places.address`, `list_places.hero_image_url` rendered as an image (if not null), and `places.description` (if not null)

---

### US-06: Draft list is not publicly accessible

**Given** a list with `is_published = false`
**When** any visitor who is NOT the owning creator requests the list's public URL
**Then** the page returns HTTP 404
**And** no list content is revealed

**Note:** Authenticated users viewing their own draft lists via the dashboard (not the public route) is out of scope for this feature; the dashboard handles that separately.

---

### US-07: List not found

**Given** any of the following conditions:
- No user exists with the given `vanity_slug`
- The user exists but has `deleted_at IS NOT NULL`
- The user exists but has no list with the given `slug`
- The list exists but has `deleted_at IS NOT NULL`
- The list exists but has `is_published = false`
**When** any visitor requests `/@{vanity_slug}/{list-slug}`
**Then** the page returns HTTP 404
**And** the page renders a user-facing 404 message

---

### US-08: List page SEO and shareability

**Given** a published list with `title = "Best Coffee in Edinburgh"` and `description = "My top picks for specialty coffee across the city"`
**When** the page `/@alex/best-coffee-edinburgh` is rendered
**Then** the HTML `<title>` is set to `"Best Coffee in Edinburgh — Alex — YourFavs"` (or equivalent)
**And** a `<meta name="description">` tag is present, populated from the list's `description` (truncated if necessary); if `description` is null, a generic fallback is used
**And** `og:title`, `og:description`, and `og:url` Open Graph tags are present and correctly populated
**And** `og:image` is set to the `hero_image_url` of the first place in the list (position 1) if available; otherwise a default YourFavs OG image is used

---

### US-09: Navigate from a list back to the creator's profile

**Given** a visitor is on a published list page at `/@alex/best-coffee-edinburgh`
**When** the page is rendered
**Then** there is a visible, clickable link that navigates to `/@alex`
**And** the link includes the creator's name (e.g. "By Alex" or "Alex's profile") so its destination is clear

---

### US-10: Navigate from a profile to a list

**Given** a visitor is on a creator's profile page at `/@alex`
**And** the creator has at least one published list
**When** the visitor clicks on a list card
**Then** the visitor is taken to the corresponding list page at `/@alex/{list-slug}`

---

### US-11: Place details on a list page

**Given** a published list with places attached via `ListPlace`
**When** a visitor views the list page
**Then** each place card displays:
  - `places.name` (always present)
  - `places.address` (always present)
  - An `<img>` element for `list_places.hero_image_url` if not null; no broken image placeholder if null
  - `places.description` if not null; the field is omitted entirely if null

---

### US-12: Place ordering is preserved

**Given** a list with multiple places each having a distinct `position` value in `ListPlace`
**When** a visitor views the list page
**Then** places are rendered in ascending order of `position`
**And** no place is omitted where `list_places.deleted_at IS NULL`

---

## 6. Out of Scope for This Iteration

The following are explicitly excluded from this feature and deferred to future releases:

- **Authentication-gated profiles or lists.** All content on the public routes is either fully public or a 404. There is no concept of "unlisted" or "friends-only" visibility.
- **Creator-facing preview of their own draft lists via the public route.** The dashboard handles this. The public route always returns 404 for drafts.
- **Pagination of lists on the profile page.** All published lists are rendered in a single page for MVP.
- **Pagination of places on the list page.** All places are rendered in a single page for MVP.
- **Map view of places.** Latitude and longitude are stored but not rendered on these pages in this iteration.
- **Social sharing buttons.** The URL itself is the sharing mechanism; no in-page share buttons are included.
- **Engagement metrics.** No view counts, like counts, or save counts are displayed.
- **Following or bookmarking a creator or list.** No social graph features.
- **Search or filtering within a profile's lists.** The full list of published lists is shown without filters.
- **Category or tag filtering.** Categories are deferred to a future release per the architecture decisions.
- **Custom image uploads.** Hero images are sourced from Google Places imagery only; no user-uploaded images.
- **Edit controls embedded in the public view for the owning creator.** Editing happens in the dashboard only.
- **Place website, phone number, rating, price level, or opening hours.** These Google Places fields are not yet cached and are excluded.
- **Canonical URL handling for slug collisions.** List slugs are unique per user; no collision resolution is required on these routes.
- **Reported or flagged content moderation.** Abuse prevention mechanisms are deferred.
