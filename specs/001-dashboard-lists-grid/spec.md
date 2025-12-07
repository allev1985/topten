# Feature Specification: Dashboard Lists and Grids

**Feature Branch**: `001-dashboard-lists-grid`  
**Created**: 2025-12-07  
**Status**: Draft  
**Input**: User description: "Create the list card component and implement the responsive grid to display lists. Each card shows a visual preview, status, and key metadata, enabling curators to quickly scan their portfolio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Lists Portfolio (Priority: P1)

As a curator, I want to see all my lists displayed as cards in a responsive grid on my dashboard, so that I can quickly scan my portfolio and get an overview of my content.

**Why this priority**: This is the core value of the dashboard - providing a visual overview of all lists. Without this, curators have no way to see what they've created.

**Independent Test**: Can be fully tested by navigating to the dashboard and verifying that all lists are displayed as cards in a grid layout, delivering immediate visibility of the curator's portfolio.

**Acceptance Scenarios**:

1. **Given** I am a curator with multiple lists, **When** I navigate to my dashboard, **Then** I see all my lists displayed as cards in a responsive grid
2. **Given** I am viewing the dashboard on a desktop screen, **When** the page loads, **Then** the grid displays 3 columns of list cards
3. **Given** I am viewing the dashboard on a tablet device, **When** the page loads, **Then** the grid displays 2 columns of list cards
4. **Given** I am viewing the dashboard on a mobile device, **When** the page loads, **Then** the grid displays 1 column of list cards

---

### User Story 2 - Identify List Status (Priority: P1)

As a curator, I want to see the publication status of each list clearly marked on its card, so that I can quickly distinguish between published and draft content.

**Why this priority**: Curators need to know which lists are live and which are still being worked on. This is critical for content management.

**Independent Test**: Can be tested by viewing the dashboard and verifying that each card displays a status badge that is visually distinct for published vs draft lists.

**Acceptance Scenarios**:

1. **Given** I have published lists, **When** I view the dashboard, **Then** each published list displays a "Published" badge
2. **Given** I have draft lists, **When** I view the dashboard, **Then** each draft list displays a "Draft" badge
3. **Given** I view published and draft lists together, **When** comparing their status badges, **Then** the badges are visually different (color, style, or both)

---

### User Story 3 - View List Metadata (Priority: P1)

As a curator, I want to see key information about each list (title, image, place count) on its card, so that I can identify and understand each list at a glance.

**Why this priority**: Metadata is essential for list identification. Without titles and place counts, the cards would be meaningless.

**Independent Test**: Can be tested by viewing the dashboard and verifying that each card displays the list title, a hero image, and the number of places.

**Acceptance Scenarios**:

1. **Given** a list has a title, **When** I view its card, **Then** the title is displayed prominently
2. **Given** a list has a long title that exceeds card width, **When** I view its card, **Then** the title is truncated with an ellipsis after 2 lines
3. **Given** a list has a hero image, **When** I view its card, **Then** the image is displayed as a visual preview
4. **Given** a list contains multiple places, **When** I view its card, **Then** the place count is displayed (e.g., "12 places")
5. **Given** a list contains exactly one place, **When** I view its card, **Then** the count displays "1 place" (singular form)
6. **Given** a list has no places, **When** I view its card, **Then** the count displays "0 places"

---

### User Story 4 - Navigate to List Details (Priority: P2)

As a curator, I want to click on a list card to navigate to that list's detail page, so that I can view or edit the full list.

**Why this priority**: Navigation to list details is important but secondary to viewing the portfolio. The MVP can function without this if users have alternative navigation.

**Independent Test**: Can be tested by clicking on any list card and verifying that the appropriate action occurs (logging ID in this implementation phase, navigation in future phases).

**Acceptance Scenarios**:

1. **Given** I am viewing the dashboard, **When** I click on a list card, **Then** the list ID is logged to the console
2. **Given** I click on the card image area, **When** the click event fires, **Then** the list ID is logged
3. **Given** I click on the card title area, **When** the click event fires, **Then** the list ID is logged
4. **Given** I click on the card metadata area, **When** the click event fires, **Then** the list ID is logged

---

### User Story 5 - Access List Actions Menu (Priority: P2)

As a curator, I want to see a menu button on each list card, so that I can access actions for that list (edit, delete, share, etc.).

**Why this priority**: While important for future functionality, the menu trigger alone doesn't provide immediate value. The actual menu content is tracked separately.

**Independent Test**: Can be tested by verifying that each card has a visible three-dot menu button in the top-right corner that doesn't trigger the card click event.

**Acceptance Scenarios**:

1. **Given** I am viewing a list card, **When** I look at the card, **Then** I see a three-dot menu button in the top-right corner
2. **Given** I click on the three-dot menu button, **When** the click event fires, **Then** it does NOT trigger the card click event (no ID logged)
3. **Given** I click on the three-dot menu button, **When** the click event fires, **Then** the menu button click is isolated from the card click

---

### Edge Cases

- What happens when a list has no hero image? (Display placeholder from placehold.co service)
- What happens when a list title is extremely long (100+ characters)? (Truncate with ellipsis after 2 lines using line-clamp-2)
- What happens when a curator has zero lists? (Display empty state message - out of scope for this feature, assumes at least one list exists)
- What happens when place count is negative or invalid? (Validation should prevent this at data layer, but display "0 places" if encountered)
- How does the grid respond between breakpoints? (Use responsive Tailwind classes with smooth transitions)
- What happens when images fail to load? (Next.js Image component handles fallback)
- How are screen readers informed about list status? (Status badges include accessible text, images have alt text)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all lists in a responsive grid layout on the dashboard
- **FR-002**: Grid MUST show 3 columns on desktop screens (typically 1024px and above)
- **FR-003**: Grid MUST show 2 columns on tablet screens (typically 768px to 1023px)
- **FR-004**: Grid MUST show 1 column on mobile screens (typically below 768px)
- **FR-005**: Each list card MUST display a hero image from the list data
- **FR-006**: Each list card MUST display a status badge indicating "Published" or "Draft"
- **FR-007**: Published and draft status badges MUST be visually distinct from each other
- **FR-008**: Each list card MUST display the list title
- **FR-009**: List titles MUST be truncated with ellipsis when exceeding 2 lines of text
- **FR-010**: Each list card MUST display the number of places in the list
- **FR-011**: Place count MUST use singular form "place" when count is 1, plural "places" otherwise
- **FR-012**: Each list card MUST display a three-dot menu button in the top-right corner
- **FR-013**: Clicking a list card (outside the menu button) MUST trigger a card click event
- **FR-014**: Clicking the three-dot menu button MUST NOT trigger the card click event
- **FR-015**: Card click event MUST log the list ID to the browser console (temporary implementation)
- **FR-016**: All images MUST have appropriate alt text for screen readers
- **FR-017**: List titles MUST use semantic HTML heading tags (h3 level)
- **FR-018**: System MUST support display of at least 5 mock lists for initial implementation
- **FR-019**: Hero images MUST use placeholder service (placehold.co) for mock data
- **FR-020**: Images MUST be optimized for web delivery

### Key Entities

- **List**: Represents a curator's collection of places
  - Attributes: id (unique identifier), title (text, variable length), heroImageUrl (URL to image), isPublished (boolean status), placeCount (number of places in list)
  - Relationships: Owned by a curator (implicit), contains multiple places (count tracked)

- **List Card**: Visual representation of a list in the dashboard grid
  - Attributes: Derived from List entity (image, title, status badge, place count, menu button)
  - Behaviors: Clickable for navigation, menu button for actions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Curators can view their complete portfolio of lists within 2 seconds of dashboard page load
- **SC-002**: Curators can identify published vs draft lists within 1 second of viewing the dashboard (visual distinction is immediately apparent)
- **SC-003**: Dashboard layout adapts seamlessly to any screen size from 320px to 4K resolution
- **SC-004**: 100% of list cards display all required metadata (image, title, status, place count) correctly
- **SC-005**: All interactive elements (card clicks, menu buttons) respond within 100ms of user action
- **SC-006**: Screen reader users can identify list title, status, and place count for each card
- **SC-007**: Test coverage meets or exceeds 65% for all new components
- **SC-008**: Zero accessibility violations for dashboard grid and cards (WCAG 2.1 AA compliance)

## Assumptions

- Mock data will be replaced with real data from the database in a future feature
- The three-dot menu button is a trigger only; dropdown menu content will be implemented in a separate feature (tracked in issue #4)
- Card click navigation to list detail pages will be implemented in a future feature; console logging is acceptable for initial implementation
- Curators always have at least one list to display (empty state out of scope)
- Hero images are available for all lists; placeholder service handles missing images
- Standard web breakpoints are acceptable (mobile <768px, tablet 768-1023px, desktop ≥1024px)
- Place count is always a non-negative integer
- List titles are plain text without rich formatting
- Authentication and authorization are handled by existing dashboard infrastructure

## Dependencies

- Next.js framework with Image component configured
- shadcn/ui component library with Card, Badge, Button, and DropdownMenu components installed
- Tailwind CSS for responsive grid layout
- lucide-react icon library for three-dot menu icon
- Placeholder image service (placehold.co) accessible from application
- Testing framework (Vitest, React Testing Library) configured and operational

## Out of Scope

- Three-dot menu dropdown content and actions (tracked separately in issue #4)
- Navigation to list detail pages (card click will only log ID initially)
- Empty state when curator has no lists
- Real data integration with database (using mock data)
- List filtering, sorting, or search functionality
- Pagination for large numbers of lists
- Drag-and-drop reordering of lists
- Bulk actions on multiple lists
- List card animations or transitions
- Dark mode support (unless already implemented at application level)
