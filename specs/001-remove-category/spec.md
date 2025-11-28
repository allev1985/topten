# Feature Specification: Remove Category Entity

**Feature Branch**: `001-remove-category`  
**Created**: 2025-11-28  
**Status**: Draft  
**Input**: User description: "Remove Category from data models and usage to align with updated high-level.md architecture"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lists Exist Without Categories (Priority: P1)

As a list creator, I want my lists to exist independently without being tied to a category, so that I have full creative freedom to organize my favourite places however I see fit.

**Why this priority**: This is the core change. Without removing the category dependency from lists, the system cannot function according to the new simplified architecture. This enables the foundational user experience.

**Independent Test**: Can be fully tested by verifying that a list can be created, saved, and retrieved without any category association. The list displays correctly to both creators and visitors.

**Acceptance Scenarios**:

1. **Given** a logged-in creator, **When** they create a new list with title and description, **Then** the list is created successfully without requiring a category selection
2. **Given** an existing list that previously had a category, **When** a visitor views the list page, **Then** the list displays correctly with all its places without showing any category information
3. **Given** a creator with multiple lists, **When** they view their profile page, **Then** all their lists are displayed without category grouping or filtering

---

### User Story 2 - Simplified List URLs (Priority: P2)

As a visitor, I want to access lists via clean, short URLs without category slugs, so that I can easily share and remember list links.

**Why this priority**: This directly impacts the user experience for sharing and discovering content. Simpler URLs are more memorable and shareable.

**Independent Test**: Can be fully tested by navigating to a list URL in the format `/@{vanity_slug}/{list-slug}` and verifying the list loads correctly.

**Acceptance Scenarios**:

1. **Given** a published list, **When** a visitor accesses `/@alex/best-coffee-spots`, **Then** the list page loads successfully showing the list content
2. **Given** an old URL format that included a category slug, **When** a visitor attempts to access it, **Then** the system returns a 404 error (no backward compatibility required for MVP)

---

### User Story 3 - Clean Creator Profile (Priority: P3)

As a visitor viewing a creator's profile, I want to see all their lists in a single unified view, so that I can easily browse everything they've curated without being forced into category navigation.

**Why this priority**: With categories removed, the profile experience becomes simpler. This completes the user-facing changes for the category removal.

**Independent Test**: Can be fully tested by visiting a creator profile page and verifying all published lists appear in a single list without category sections.

**Acceptance Scenarios**:

1. **Given** a creator with multiple published lists, **When** a visitor views their profile at `/@alex`, **Then** all published lists appear in a single chronological or alphabetical list without category headers
2. **Given** the homepage, **When** a visitor views featured or recent lists, **Then** lists are displayed without category labels or category-based filtering options

---

### Edge Cases

- What happens when existing lists have a category_id in the database? The migration must handle this by removing the column or setting it to null before dropping the constraint.
- How does the system handle database queries that previously filtered or joined by category? All such queries must be updated to remove category references.
- What happens to seed data that includes categories? The category seeding logic must be removed and the seed process must work without it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow list creation without requiring a category selection
- **FR-002**: System MUST display lists without any category information in the UI
- **FR-003**: System MUST support list URLs in the format `/@{vanity_slug}/{list-slug}` without category slug component
- **FR-004**: System MUST display creator profiles with lists in a single unified view without category grouping
- **FR-005**: System MUST remove the Category table and all its data from the database
- **FR-006**: System MUST remove the category_id foreign key from the List table
- **FR-007**: System MUST remove all category-related indexes from the database
- **FR-008**: System MUST not require any category data for database seeding operations
- **FR-009**: System MUST update all data access code to remove category references and joins

### Key Entities

- **User**: Creator profiles with id, email, name, bio, avatar_url, vanity_slug, and timestamps. Unchanged by this feature.
- **List**: User-curated collections with id, user_id, title, slug, description, is_published, published_at, and timestamps. Now exists without category_id reference.
- **Place**: Cached place data from Google Places with id, google_place_id, name, address, latitude, longitude, and timestamps. Unchanged by this feature.
- **ListPlace**: Junction table linking lists to places with id, list_id, place_id, position, hero_image_url, and timestamps. Unchanged by this feature.

**Note**: The Category entity is being removed entirely from the data model.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of lists can be created and managed without any category association
- **SC-002**: All list URLs follow the simplified format `/@{vanity_slug}/{list-slug}` without category slug
- **SC-003**: Creator profile pages display all lists without category grouping, loading in under 2 seconds
- **SC-004**: Database schema contains no Category table or category-related columns/indexes after migration
- **SC-005**: All existing automated tests pass after the category removal changes are implemented
- **SC-006**: Zero database queries reference the categories table or category_id column

## Assumptions

- The existing codebase has no user-facing features that rely on categories for navigation or filtering (confirmed per high-level.md which defers categories to future releases)
- No existing production data needs to be migrated (this is a pre-launch architectural change)
- The high-level.md architecture document represents the authoritative target state
- Backward compatibility with old category-based URLs is not required
- No external systems depend on category data from this application
