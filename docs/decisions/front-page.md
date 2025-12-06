# Landing Page Implementation - Engineering Stories

## Epic Overview

**Epic:** YourFavs Landing Page
**Goal:** Build a visual-first landing page that serves as the primary entry point for all users, with modal-based authentication flows.

**Context:**

- Platform: Next.js 14+ with App Router
- Auth: Supabase Authentication
- UI: shadcn/ui + Tailwind CSS (v4)
- Architecture: Server Components for initial render, Client Components for interactions
- Target: MVP launch with modern UI using existing design system

**Already Implemented:**

- ✅ Supabase client and server utilities configured (`src/lib/supabase/`)
- ✅ Auth actions for login/signup (`src/actions/auth-actions.ts`)
- ✅ Login and signup forms with full validation (`src/app/(auth)/`)
- ✅ shadcn/ui components: Button, Input, Label, Card, Alert (`src/components/ui/`)
- ✅ Path aliases configured (`@/components`, `@/lib`, etc.)
- ✅ Testing infrastructure: Vitest for unit/integration, Playwright for E2E
- ✅ Environment variables and configuration
- ✅ Basic landing page at `/` (needs enhancement)

**To Build:**

- Dialog component for modals (add via shadcn CLI)
- Landing page with static content
- Modal wrappers for existing auth forms
- Hero section with image grid
- Responsive header with CTAs

**User Journey:**

1. User visits / → sees landing page
2. User clicks "Start Curating" → signup modal opens
3. User signs up → receives email verification
4. User verifies email and logs in → redirected to /dashboard

**Technical Approach:**

- Server Component renders static content
- Client Component manages modal state and interactions
- Auth forms handle Supabase integration directly
- Placeholder images for rapid deployment
- Landing page always shows same content for all users

---

## Story 1: Project Setup & Dependencies

**Priority:** P0 - Blocker  
**Estimated Lines:** ~20 (config file updates only)  
**Story Points:** 1

### Description

Add missing shadcn/ui Dialog component and configure Next.js for external images. Most dependencies are already installed.

### Context

**Already Complete:**

- ✅ shadcn/ui is configured in `components.json` with path aliases
- ✅ Button, Input, Label, Card, Alert components already exist in `src/components/ui/`
- ✅ Supabase is configured with client and server utilities in `src/lib/supabase/`
- ✅ Environment variables are configured (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- ✅ lucide-react is installed for icons
- ✅ Component directories exist: `src/components/ui/`, `src/components/auth/`, `src/components/shared/`

**Still Needed:**

- Dialog component from shadcn/ui (not yet installed)
- Configure Next.js `next.config.ts` for placehold.co images

### Tasks

1. Install Dialog component: `pnpm dlx shadcn@latest add dialog`
2. Add placehold.co to Next.js image remote patterns in `next.config.ts`

### Acceptance Criteria

- [x] Button, Input, Label, Card, Alert components exist in `src/components/ui/`
- [x] Supabase utilities exist in `src/lib/supabase/`
- [x] Path aliases configured in `components.json`
- [ ] Dialog component added to `src/components/ui/dialog.tsx`
- [ ] `next.config.ts` includes placehold.co in image remotePatterns
- [ ] Build passes: `pnpm build`

### Testing Requirements

- [ ] Verify Dialog component can be imported: `import { Dialog } from "@/components/ui/dialog"`
- [ ] Verify build completes without errors

### Files Modified/Created

- `next.config.ts` (modified - add image remote patterns)
- `src/components/ui/dialog.tsx` (created by shadcn CLI)

### Definition of Done

- Dialog component installed
- Image configuration complete
- Build passes without warnings
- Ready for component development

---

## Story 2: Landing Page Shell

**Priority:** P0 - Blocker  
**Estimated Lines:** ~80 (including tests)  
**Story Points:** 2  
**Dependencies:** Story 1

### Description

Transform the current basic landing page into a proper shell with a Client Component wrapper. The current `src/app/page.tsx` has basic content that needs to be replaced with the landing page structure.

### Context

**Current State:**

- Basic landing page exists at `src/app/page.tsx` with simple HTML structure
- No client/server component split

**Target State:**
The landing page should be a Server Component that renders the initial shell and passes control to a Client Component. This pattern ensures fast initial render while enabling client-side interactivity for modals.

**Technical Details:**

- `src/app/page.tsx`: Server Component
- `src/components/shared/LandingPageClient.tsx`: Client Component shell

### Tasks

1. Update `src/app/page.tsx` to Server Component
2. Create `src/components/shared/LandingPageClient.tsx` shell
3. Add placeholder content to verify routing
4. Write tests for rendering

### Acceptance Criteria

- [ ] Visiting `/` renders without errors
- [ ] Page works for all users
- [ ] No hydration errors in console

### Testing Requirements

**Target Coverage:** 70%

**Unit Tests:**

- [ ] Verify page renders correctly

**Integration Tests:**

- [ ] Page renders without crashing
- [ ] No console errors during render

### Files Created/Modified

- `src/app/page.tsx` (~15 lines, modified)
- `src/components/shared/LandingPageClient.tsx` (~20 lines, created)
- `tests/unit/app/page.test.tsx` (~30 lines, created)

### Example Test Cases

```typescript
// Test: Page renders
describe("Landing Page", () => {
  it("renders correctly", async () => {
    // Render page
    // Assert LandingPageClient is rendered
  });
});
```

### Definition of Done

- Page accessible at `/` route
- Tests passing at 70%+ coverage
- No TypeScript errors
- Ready for Header component integration

---

## Story 3: Header Component

**Priority:** P0 - Critical  
**Estimated Lines:** ~100 (including tests)  
**Story Points:** 3  
**Dependencies:** Story 2

### Description

Build the navigation header with YourFavs logo and call-to-action buttons. Header displays CTAs and triggers auth modals (wired in later story).

### Context

The header is the primary navigation element visible on every landing page load. It provides easy access to auth flows. The header is a Client Component because it needs to handle click events for opening modals.

**Design:**

- Logo: MapPin icon in orange circle + "YourFavs" text
- Actions: "Log In" (ghost button) + "Start Curating" (primary button)
- Header is static scroll (not fixed)

### Technical Details

- Component: `src/components/shared/Header.tsx` (Client Component)
- Props: `onLoginClick: () => void`, `onSignupClick: () => void`
- Uses lucide-react for MapPin icon (already installed)
- Uses shadcn Button component with variants (already exists)
- Logo links to `/` using Next.js Link

### Tasks

1. Create Header component structure
2. Implement logo with icon and text
3. Add CTAs
4. Wire up click handlers (pass through props)
5. Add Tailwind styling for layout and spacing
6. Integrate Header into LandingPageClient
7. Write component tests

### Acceptance Criteria

- [ ] Header renders at top of landing page
- [ ] Logo displays MapPin icon in orange circle
- [ ] Logo text reads "YourFavs"
- [ ] Logo links to `/` route
- [ ] Shows "Log In" and "Start Curating" buttons
- [ ] Click handlers fire when buttons clicked
- [ ] Header spans full width with proper padding
- [ ] Buttons are properly spaced and aligned
- [ ] All buttons are keyboard accessible (Tab key)

### Testing Requirements

**Target Coverage:** 65%

**Unit Tests:**

- [ ] Header renders correctly
- [ ] "Log In" button calls onLoginClick when clicked
- [ ] "Start Curating" button calls onSignupClick when clicked
- [ ] Logo links to correct route
- [ ] All buttons have correct variants

**Accessibility Tests:**

- [ ] All interactive elements are keyboard accessible
- [ ] Buttons have proper ARIA labels
- [ ] Logo link has accessible text

### Files Created

- `src/components/shared/Header.tsx` (~50 lines)
- `tests/unit/components/shared/Header.test.tsx` (~60 lines)

### Example Test Cases

```typescript
// Test: Header shows correct CTAs
describe("Header", () => {
  it("shows login and signup buttons", () => {
    // Render
    // Assert "Log In" button exists
    // Assert "Start Curating" button exists
  });

  it("calls onLoginClick when Log In clicked", () => {
    // Create mock function
    // Render with onLoginClick={mockFn}
    // Click "Log In" button
    // Assert mockFn was called
  });
});
```

### Design Reference

```
┌─────────────────────────────────────────────────────────┐
│  [○ MapPin] YourFavs          [Log In] [Start Curating] │
└─────────────────────────────────────────────────────────┘
```

### Definition of Done

- Header component rendering correctly
- Click handlers working
- Tests passing at 65%+ coverage
- Accessibility requirements met
- Integrated into landing page

---

## Story 4: Hero Image Grid Component

**Priority:** P1 - High  
**Estimated Lines:** ~130 (including tests)  
**Story Points:** 3  
**Dependencies:** Story 2

### Description

Create the hero image grid component that displays 4 placeholder images in an asymmetric layout. This provides the visual appeal of the landing page and establishes the responsive grid pattern.

### Context

The hero image grid is a key visual element that demonstrates the type of content users can curate. For MVP, we use placeholder images from placehold.co. The grid layout is asymmetric to create visual interest: one tall image (library), one wide image (gallery), and two standard images.

**Grid Layout:**

```
[Coffee] [Library - tall]
[Market] [Library]
[Gallery - wide across both columns]
```

### Technical Details

- Component: `src/components/shared/HeroImageGrid.tsx` (Server Component - no interactivity)
- Uses Next.js Image component with `fill` prop
- Images: placehold.co with different colors for visual distinction
- Responsive: Single column on mobile, grid on desktop
- Grid: Tailwind CSS Grid with explicit column/row spans

### Tasks

1. Create HeroImageGrid component
2. Implement Tailwind CSS Grid layout
3. Add 4 Next.js Image components with placeholder URLs
4. Configure responsive breakpoints (mobile → desktop)
5. Add proper alt text for accessibility
6. Optimize image loading (priority, sizes)
7. Integrate into LandingPageClient hero section
8. Write component tests

### Acceptance Criteria

- [ ] Component renders 4 images
- [ ] Grid layout matches design (asymmetric)
- [ ] Images use Next.js Image component with optimization
- [ ] Placeholder URLs load correctly from placehold.co
- [ ] Alt text provided for all images
- [ ] Priority loading set for above-fold images
- [ ] Responsive: Stacks vertically on mobile (< 768px)
- [ ] Responsive: Grid layout on desktop (≥ 768px)
- [ ] No layout shift (CLS) on image load
- [ ] Rounded corners on image containers
- [ ] Proper aspect ratios maintained

### Testing Requirements

**Target Coverage:** 60%

**Unit Tests:**

- [ ] Component renders without crashing
- [ ] Renders 4 Image components
- [ ] Each Image has correct src URL
- [ ] Each Image has alt text
- [ ] Each Image has sizes prop for responsive optimization
- [ ] Priority images have priority prop

**Visual Regression Tests (optional):**

- [ ] Snapshot test for grid layout

### Files Created

- `src/components/shared/HeroImageGrid.tsx` (~60 lines)
- `tests/unit/components/shared/HeroImageGrid.test.tsx` (~70 lines)

### Image Specifications

```typescript
// Coffee Shop: 800x600 (orange)
src: "https://placehold.co/800x600/e67e22/ffffff?text=Coffee+Shop";
alt: "Cozy coffee shop interior with latte art";

// Library: 600x800 (blue, tall)
src: "https://placehold.co/600x800/3498db/ffffff?text=Library";
alt: "Beautiful library with natural light and bookshelves";

// Market: 800x600 (green)
src: "https://placehold.co/800x600/2ecc71/ffffff?text=Market";
alt: "Bustling food market with vendors";

// Gallery: 1000x500 (purple, wide)
src: "https://placehold.co/1000x500/9b59b6/ffffff?text=Art+Gallery";
alt: "Modern art gallery with white walls";
```

### Grid Classes

```typescript
Container: "grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 gap-4";
Coffee: "col-span-1 row-span-1";
Library: "col-span-1 md:row-span-2";
Market: "col-span-1 row-span-1";
Gallery: "col-span-1 md:col-span-2 row-span-1";
```

### Definition of Done

- Image grid renders correctly
- Responsive behavior working
- Images optimized and loading properly
- Tests passing at 60%+ coverage
- Accessibility requirements met
- Integrated into landing page layout

---

## Story 5: Login Modal Panel Component

**Priority:** P1 - High  
**Estimated Lines:** ~150 (new modal wrapper + tests)  
**Story Points:** 5  
**Dependencies:** Story 1, Story 2

### Description

Create a modal wrapper for the existing login form to enable login from the landing page. The login form already exists at `src/app/(auth)/login/login-form.tsx` with full Supabase integration and uses server actions.

### Context

**Already Complete:**

- ✅ LoginForm component exists with email/password inputs
- ✅ Form uses `loginAction` from `@/actions/auth-actions`
- ✅ Supabase integration via server action (not client-side)
- ✅ Error handling and validation
- ✅ Card, Alert, Input, Label components used
- ✅ Loading states during submission
- ✅ Redirect handling after successful login

**Still Needed:**

- Create a lightweight modal wrapper using Dialog component
- Adapt the existing LoginForm for use in a modal context
- Wire up the modal to Header "Log In" button

**Auth Flow:**

1. User clicks "Log In" → Dialog opens with LoginForm
2. User enters email/password → Submits form
3. Form calls server action `loginAction`
4. Success → Redirects to dashboard
5. Error → Error message displayed inline in form

### Technical Details

**Existing Components:**

- `src/app/(auth)/login/login-form.tsx`: Complete form with server action integration
- `src/actions/auth-actions.ts`: Contains `loginAction` server action

**New Component:**

- `src/components/auth/LoginModal.tsx`: Dialog wrapper that renders LoginForm

**Key Differences from Original Plan:**

- No need to create form logic - it already exists
- Uses server actions instead of client-side Supabase calls
- Form already handles redirects via `loginAction`
- Just need Dialog wrapper and integration

### Tasks

1. Refactor: Move `src/app/(auth)/login/login-form.tsx` to `src/components/auth/login-form.tsx`
2. Update import in `src/app/(auth)/login/page.tsx`
3. Create LoginModal component using Dialog from shadcn
4. Import and render `LoginForm` from `@/components/auth/login-form` inside Dialog
5. Handle dialog open/close state
6. Pass appropriate props to LoginForm (redirectTo)
7. Integrate modal into LandingPageClient
8. Wire up Header "Log In" button to open modal
9. Handle successful login (close modal, trigger refresh)
10. Write tests for modal behavior

### Acceptance Criteria

**LoginModal:**

- [ ] Dialog opens when open={true}
- [ ] Dialog closes when onOpenChange(false) called
- [ ] Dialog contains existing LoginForm component
- [ ] Dialog closes with Escape key
- [ ] Dialog closes with outside click
- [ ] Dialog has proper ARIA labels
- [ ] Dialog scrolls if content overflows

**Integration:**

- [ ] "Log In" button in Header opens LoginModal
- [ ] Modal state managed in LandingPageClient
- [ ] Closing modal resets state
- [ ] Successful login closes modal and refreshes page

**LoginForm Behavior (already implemented):**

- [x] Email input with validation
- [x] Password input with validation
- [x] Submit button shows loading state
- [x] Error messages display when auth fails
- [x] Form uses server action for authentication
- [x] Successful login triggers redirect

### Testing Requirements

**Target Coverage:** 65%

**LoginModal Unit Tests:**

- [ ] Dialog renders when open=true
- [ ] Dialog hidden when open=false
- [ ] onOpenChange called when closed
- [ ] Contains LoginForm component
- [ ] Passes redirectTo prop correctly

**Integration Tests:**

- [ ] "Log In" button opens modal
- [ ] Modal closes after successful login
- [ ] Modal can be manually closed
- [ ] Form submission works within modal

**Accessibility Tests:**

- [ ] Focus trapped in modal when open
- [ ] Focus returns to trigger button when closed
- [ ] Escape key closes modal
- [ ] Screen reader announcements correct

### Files Created

- `src/components/auth/LoginModal.tsx` (~60 lines)
- `tests/unit/components/auth/LoginModal.test.tsx` (~90 lines)

### Example Implementation

```typescript
// LoginModal wraps existing form
export function LoginModal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log in to YourFavs</DialogTitle>
        </DialogHeader>
        <LoginForm redirectTo="/dashboard" />
      </DialogContent>
    </Dialog>
  );
}
```

### Example Test Cases

```typescript
describe('LoginModal', () => {
  it('renders LoginForm when open', () => {
    render(<LoginModal open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('calls onOpenChange when closed', () => {
    const mockOnChange = jest.fn();
    render(<LoginModal open={true} onOpenChange={mockOnChange} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });
});
```

### Definition of Done

- Login modal wrapper created
- Existing LoginForm integrated into modal
- Dialog behavior correct
- Tests passing at 65%+ coverage
- Integrated into landing page
- All accessibility requirements met

---

## Story 6: Signup Modal Panel Component

**Priority:** P1 - High  
**Estimated Lines:** ~150 (new modal wrapper + tests)  
**Story Points:** 5  
**Dependencies:** Story 1, Story 2

### Description

Create a modal wrapper for the existing signup form to enable registration from the landing page. The signup form already exists at `src/app/(auth)/signup/signup-form.tsx` with full Supabase integration and uses server actions.

### Context

**Already Complete:**

- ✅ SignupForm component exists with email/password/confirm-password inputs
- ✅ Form uses `signupAction` from `@/actions/auth-actions`
- ✅ Supabase integration via server action (not client-side)
- ✅ Client-side password validation (strength indicator)
- ✅ Error handling and field validation
- ✅ Card, Alert, Input, Label components used
- ✅ Loading states during submission
- ✅ Redirect handling after successful signup

**Still Needed:**

- Create a lightweight modal wrapper using Dialog component
- Adapt the existing SignupForm for use in a modal context
- Wire up the modal to "Start Curating" buttons
- Handle success state in modal (show verification message)

**Auth Flow:**

1. User clicks "Start Curating" → Dialog opens with SignupForm
2. User enters email, password, confirm password
3. Client-side validation (passwords match, strength check)
4. Form calls server action `signupAction`
5. Success → Success message: "Check your email!" (dialog stays open)
6. User verifies email → Can log in
7. Error → Error message displayed inline

### Technical Details

**Existing Components:**

- `src/app/(auth)/signup/signup-form.tsx`: Complete form with server action integration
- `src/actions/auth-actions.ts`: Contains `signupAction` server action
- `src/lib/utils/validation/password.ts`: Password validation utility (already exists)

**New Component:**

- `src/components/auth/SignupModal.tsx`: Dialog wrapper that renders SignupForm

**Key Differences from Original Plan:**

- No need to create form logic - it already exists
- Uses server actions instead of client-side Supabase calls
- Form already has password strength indicator
- Just need Dialog wrapper and success message handling

### Tasks

1. Refactor: Move `src/app/(auth)/signup/signup-form.tsx` to `src/components/auth/signup-form.tsx`
2. Update import in `src/app/(auth)/signup/page.tsx`
3. Create SignupModal component using Dialog from shadcn
4. Import and render `SignupForm` from `@/components/auth/signup-form` inside Dialog
5. Handle dialog open/close state
6. Handle success state (show verification message in modal)
7. Integrate modal into LandingPageClient
8. Wire up "Start Curating" buttons to open modal
9. Write tests for modal behavior

### Acceptance Criteria

**SignupModal:**

- [ ] Dialog opens when open={true}
- [ ] Dialog closes when onOpenChange(false) called
- [ ] Dialog shows "Create your account" title
- [ ] Dialog shows "Start curating your favorite places" description
- [ ] Dialog contains existing SignupForm component
- [ ] Dialog closes with Escape key
- [ ] Dialog closes with outside click
- [ ] Dialog stays open when showing success message
- [ ] Success message displays after successful signup
- [ ] Dialog has proper ARIA labels

**Integration:**

- [ ] "Start Curating" button in Header opens SignupModal
- [ ] "Create Your First List" CTA opens SignupModal
- [ ] Modal state managed in LandingPageClient
- [ ] Closing modal resets form state

**SignupForm Behavior (already implemented):**

- [x] Email input with validation
- [x] Password input with strength indicator
- [x] Confirm password validation
- [x] Submit button shows loading state
- [x] Error messages display when signup fails
- [x] Form uses server action for signup
- [x] Success handling with redirect

### Testing Requirements

**Target Coverage:** 65%

**SignupModal Unit Tests:**

- [ ] Dialog renders when open=true
- [ ] Dialog hidden when open=false
- [ ] onOpenChange called when closed
- [ ] Contains SignupForm component
- [ ] Has correct title and description
- [ ] Displays success message when signup succeeds

**Integration Tests:**

- [ ] "Start Curating" buttons open modal
- [ ] Modal displays success message after signup
- [ ] Modal can be manually closed
- [ ] Form submission works within modal

**Accessibility Tests:**

- [ ] Focus trapped in modal when open
- [ ] Focus returns to trigger button when closed
- [ ] Escape key closes modal
- [ ] Success message announced to screen readers

### Files Created

- `src/components/auth/SignupModal.tsx` (~80 lines)
- `tests/unit/components/auth/SignupModal.test.tsx` (~90 lines)

### Example Implementation

```typescript
// SignupModal wraps existing form
export function SignupModal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create your account</DialogTitle>
          <DialogDescription>
            Start curating your favorite places
          </DialogDescription>
        </DialogHeader>
        <SignupForm />
      </DialogContent>
    </Dialog>
  );
}
```

### Example Test Cases

```typescript
describe('SignupModal', () => {
  it('renders SignupForm when open', () => {
    render(<SignupModal open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('keeps dialog open after success', async () => {
    // Mock successful signup
    render(<SignupModal open={true} onOpenChange={jest.fn()} />);
    // Trigger successful form submission
    // Assert success message visible
    // Assert dialog still open
  });
});
```

### Success Message Copy

```
Title: "Check your email!"
Message: "We've sent you a confirmation link. Click it to verify your account and get started."
```

### Definition of Done

- Signup modal wrapper created
- Existing SignupForm integrated into modal
- Success message handling implemented
- Dialog behavior correct
- Tests passing at 65%+ coverage
- Integrated into landing page
- All accessibility requirements met

---

## Story 7: Hero Section Integration & CTA Wiring

**Priority:** P0 - Critical  
**Estimated Lines:** ~150 (including tests)  
**Story Points:** 5  
**Dependencies:** Stories 2, 3, 4, 6

### Description

Complete the LandingPageClient component by adding the hero text section and wiring up the primary CTA button. This brings together all components into the final landing page layout.

### Context

The hero section is the main content area of the landing page, split into two columns: text content (left) with CTA button, and image grid (right).

**Layout:**

```
┌─────────────────────────────────────┐
│  Header (Story 3)                   │
├──────────────┬──────────────────────┤
│  Hero Text   │   Image Grid         │
│  + CTA       │   (Story 4)          │
│              │                      │
│  [Button]    │   [Images]           │
└──────────────┴──────────────────────┘
```

**CTA Behavior:**

- Opens signup modal

### Technical Details

**Hero Text Content:**

- Tagline: "Your personal guide to the world" (with Sparkles icon)
- Headline: "Curate and share your favourite places"
- Subheading: "Build focused, meaningful collections that reflect your genuine preferences and local expertise. Share them like recommendations from a trusted friend."
- CTA Button: "Create Your First List"

**Layout:**

- Container: CSS Grid, 5 columns on desktop
- Left (text): 2 columns (40%)
- Right (images): 3 columns (60%)
- Responsive: Stack vertically on mobile

**State Management:**

- `loginOpen` state for LoginModal
- `signupOpen` state for SignupModal
- Wire Header click handlers
- Wire CTA click handler

### Tasks

1. Update LandingPageClient with hero text content
2. Add Sparkles icon from lucide-react
3. Implement grid layout (40/60 split)
4. Add primary CTA button
5. Connect Header button handlers to modal state
6. Connect CTA button handler to modal state
7. Add responsive breakpoints for mobile
8. Ensure all components render in correct order
9. Write integration tests

### Acceptance Criteria

**Hero Section:**

- [ ] Tagline displays with Sparkles icon
- [ ] Headline displays at correct size (text-5xl)
- [ ] Subheading displays with proper color (text-gray-600)
- [ ] CTA button displays below text content
- [ ] Text content aligned to left, vertically centered
- [ ] Image grid displays on right side
- [ ] Layout is 40/60 split on desktop
- [ ] Layout stacks vertically on mobile (<1024px)

**CTA Button Behavior:**

- [ ] Button is interactive (onClick handler)
- [ ] Clicking opens signup modal
- [ ] Button text reads "Create Your First List"
- [ ] Button has proper size (size="lg")

**State Management:**

- [ ] loginOpen state controls LoginModal
- [ ] signupOpen state controls SignupModal
- [ ] Header "Log In" button sets loginOpen=true
- [ ] Header "Start Curating" button sets signupOpen=true
- [ ] Hero CTA button sets signupOpen=true
- [ ] Modals close when onOpenChange(false) called

**Layout & Spacing:**

- [ ] Proper padding around content (px-6, py-16)
- [ ] Maximum content width (max-w-7xl)
- [ ] Content centered (mx-auto)
- [ ] Proper gap between grid columns (gap-12)
- [ ] Responsive padding on mobile

### Testing Requirements

**Target Coverage:** 65%

**Integration Tests:**

- [ ] LandingPageClient renders all sections
- [ ] Header renders with correct props
- [ ] Hero text section renders
- [ ] Image grid renders
- [ ] Both modals render (LoginModal and SignupModal)

**State Management Tests:**

- [ ] Clicking Header "Log In" opens LoginModal
- [ ] Clicking Header "Start Curating" opens SignupModal
- [ ] Clicking Hero CTA opens SignupModal
- [ ] Only one modal opens at a time
- [ ] Closing modal sets state to false

**Responsive Tests:**

- [ ] Layout is 5-column grid on desktop
- [ ] Layout is 1-column on mobile
- [ ] All content visible on mobile
- [ ] No horizontal scroll on any viewport

### Files Modified/Created

- `src/components/shared/LandingPageClient.tsx` (major updates, ~120 lines)
- `tests/integration/components/LandingPageClient.test.tsx` (~100 lines)

### Example Test Cases

```typescript
describe("LandingPageClient Integration", () => {
  it("renders all sections correctly", () => {
    // Render component
    // Assert Header exists
    // Assert hero text exists
    // Assert image grid exists
    // Assert CTA button exists
  });

  it("opens signup modal when CTA clicked", () => {
    // Render component
    // Click "Create Your First List" button
    // Assert SignupModal open={true}
  });

  it("header buttons control modal state", () => {
    // Render component
    // Click "Log In"
    // Assert LoginModal opens
    // Close modal
    // Click "Start Curating"
    // Assert SignupModal opens
  });
});
```

### Copy Reference

```typescript
const content = {
  tagline: "Your personal guide to the world",
  headline: "Curate and share your favourite places",
  subheading:
    "Build focused, meaningful collections that reflect your genuine preferences and local expertise. Share them like recommendations from a trusted friend.",
  cta: "Create Your First List",
};
```

### Definition of Done

- Complete landing page layout implemented
- All components integrated and rendering
- CTA button opens signup modal
- Modal state management working
- Responsive design implemented
- Tests passing at 65%+ coverage
- No console errors or warnings
- Ready for end-to-end testing

---

## Story 8: Responsive Design Polish & E2E Testing

**Priority:** P2 - Medium  
**Estimated Lines:** ~150 (styling updates + tests)  
**Story Points:** 5  
**Dependencies:** All previous stories

### Description

Polish the responsive design across all breakpoints, add final styling touches, and implement end-to-end testing for complete user flows. Ensure the landing page works flawlessly on mobile, tablet, and desktop.

### Context

While basic responsive design is implemented in component stories, this story focuses on cross-component responsive behavior, edge cases, and the complete user experience. End-to-end tests validate the entire authentication flow from landing page to dashboard.

**Devices to Test:**

- Mobile: 375px (iPhone SE)
- Mobile: 414px (iPhone 12)
- Tablet: 768px (iPad)
- Desktop: 1024px (laptop)
- Desktop: 1440px (desktop)

### Technical Details

**Responsive Improvements:**

- Header: Stack logo and buttons on very small screens if needed
- Hero: Adjust text sizes for mobile readability
- Image Grid: Optimize heights for mobile
- Modals: Ensure dialogs don't exceed viewport
- Buttons: Touch-friendly sizes (min 44x44px)

**Performance:**

- Ensure images lazy load below fold
- Verify no layout shift (CLS)
- Check Lighthouse scores

**E2E Flow:**

1. Visit landing page at `/`
2. Click "Start Curating" to open modal
3. Fill signup form in modal
4. See success message in modal
5. Close modal
6. Manually verify email (outside test)
7. Click "Log In" to open modal
8. Fill login form in modal
9. Redirect to /dashboard

### Tasks

1. Review all components at each breakpoint
2. Adjust spacing, sizing for mobile
3. Test touch interactions on mobile
4. Add mobile-specific styling where needed
5. Test keyboard navigation on desktop
6. Write E2E tests for signup flow
7. Write E2E tests for login flow
8. Test error scenarios end-to-end
9. Run Lighthouse audit
10. Fix any accessibility issues found

### Acceptance Criteria

**Responsive Design:**

- [ ] Landing page looks good on 375px width
- [ ] Landing page looks good on 768px width
- [ ] Landing page looks good on 1440px width
- [ ] No horizontal scroll on any screen size
- [ ] All text readable without zooming
- [ ] Buttons are touch-friendly (≥44x44px)
- [ ] Images scale appropriately
- [ ] Dialogs fit within viewport on mobile
- [ ] Form inputs are easy to tap on mobile

**Typography:**

- [ ] Headline readable on mobile (reduce size if needed)
- [ ] Subheading has proper line height
- [ ] No text overflow or truncation

**Spacing:**

- [ ] Consistent padding across components
- [ ] Proper vertical rhythm
- [ ] No elements too close together on mobile

**Performance:**

- [ ] Lighthouse Performance score ≥90
- [ ] Lighthouse Accessibility score ≥95
- [ ] CLS (Cumulative Layout Shift) ≤0.1
- [ ] LCP (Largest Contentful Paint) ≤2.5s

**Keyboard Navigation:**

- [ ] Tab order logical
- [ ] All interactive elements reachable
- [ ] Focus visible on all elements
- [ ] Enter/Space activate buttons
- [ ] Escape closes dialogs

### Testing Requirements

**Target Coverage:** 60% (E2E tests)

**E2E Test Scenarios:**

**Happy Path - Signup:**

```typescript
test("completes signup flow", async ({ page }) => {
  // Visit landing page
  await page.goto("/");
  // Click "Start Curating" to open modal
  await page.click("text=Start Curating");
  // Fill email and password in modal
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  // Submit form
  await page.click('button[type="submit"]');
  // See success message
  await expect(page.locator("text=Check your email")).toBeVisible();
});
```

**Happy Path - Login:**

```typescript
test("completes login flow", async ({ page }) => {
  // Visit landing page
  await page.goto("/");
  // Click "Log In" to open modal
  await page.click("text=Log In");
  // Fill credentials in modal
  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "password123");
  // Submit form
  await page.click('button[type="submit"]');
  // Redirect to dashboard
  await expect(page).toHaveURL("/dashboard");
});
```

**Error Scenarios:**

```typescript
test("shows error on invalid credentials", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Log In");
  await page.fill('input[name="email"]', "wrong@example.com");
  await page.fill('input[name="password"]', "wrongpass");
  await page.click('button[type="submit"]');
  // Error message appears in modal
  await expect(page.locator('[role="alert"]')).toBeVisible();
});

test("shows error on existing email signup", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Start Curating");
  await page.fill('input[name="email"]', "existing@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  // Error message appears
  await expect(page.locator('[role="alert"]')).toBeVisible();
});
```

**Responsive Tests:**

```typescript
test("works on mobile viewport", async ({ page }) => {
  // Set viewport to 375x667 (iPhone SE)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  // Verify layout stacked
  // Click buttons
  await page.click("text=Start Curating");
  // Verify modal works
  await expect(page.locator('[role="dialog"]')).toBeVisible();
});
```

**Accessibility Tests:**

```typescript
test("supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  // Tab through all elements
  await page.keyboard.press("Tab");
  // Verify focus order
  // Open modal with Enter
  await page.keyboard.press("Enter");
  // Close with Escape
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

### Files Created/Modified

- `src/components/shared/LandingPageClient.tsx` (styling updates)
- `src/components/shared/Header.tsx` (mobile improvements)
- `src/components/shared/HeroImageGrid.tsx` (mobile heights)
- `tests/e2e/landing-page.spec.ts` (~150 lines)

### Lighthouse Targets

```json
{
  "performance": 90,
  "accessibility": 95,
  "best-practices": 90,
  "seo": 90,
  "metrics": {
    "CLS": 0.1,
    "LCP": 2500,
    "FID": 100
  }
}
```

### Responsive Breakpoint Reference

```css
/* Mobile: default styles */
/* Tablet: md: breakpoint (768px+) */
/* Desktop: lg: breakpoint (1024px+) */
/* Large Desktop: xl: breakpoint (1280px+) */
```

### Definition of Done

- Landing page works on all screen sizes
- All E2E tests passing
- Lighthouse scores meet targets
- No console errors or warnings
- Keyboard navigation fully functional
- Touch interactions tested on real device
- All accessibility issues resolved
- Ready for production deployment

---

## Epic Completion Checklist

After all stories are complete:

### Functionality

- [ ] Landing page renders correctly
- [ ] Authentication detection working
- [ ] Login flow complete
- [ ] Signup flow complete
- [ ] Email verification flow documented
- [ ] Error handling comprehensive
- [ ] Loading states on all async actions

### Code Quality

- [ ] All tests passing
- [ ] Test coverage ≥65%
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code reviewed and approved

### Performance

- [ ] Lighthouse scores meet targets
- [ ] Images optimized
- [ ] No layout shift
- [ ] Fast initial load

### Accessibility

- [ ] WCAG AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast sufficient

### Documentation

- [ ] README updated
- [ ] Component documentation written
- [ ] Deployment guide created
- [ ] Known issues documented

### Deployment

- [ ] Environment variables configured
- [ ] Production build succeeds
- [ ] Tested on staging
- [ ] Ready for production release

---

## Story Metrics Summary

| Story           | Lines      | Points | Coverage    | Priority |
| --------------- | ---------- | ------ | ----------- | -------- |
| 1. Setup        | ~20        | 1      | N/A         | P0       |
| 2. Page Shell   | ~120       | 3      | 70%         | P0       |
| 3. Header       | ~150       | 5      | 65%         | P0       |
| 4. Image Grid   | ~130       | 3      | 60%         | P1       |
| 5. Login Modal  | ~150       | 5      | 65%         | P1       |
| 6. Signup Modal | ~150       | 5      | 65%         | P1       |
| 7. Integration  | ~220       | 5      | 65%         | P0       |
| 8. Polish & E2E | ~150       | 5      | 60%         | P2       |
| **Total**       | **~1,090** | **32** | **66% avg** | -        |

**Note:** Line counts include test files. Many foundational pieces (auth forms, Supabase setup, shadcn components) already exist, reducing implementation from original estimates.

---

## Development Workflow

**For Each Story:**

1. Read story description and context
2. Review acceptance criteria
3. Set up test file first (TDD approach)
4. Implement component/feature
5. Write tests as you go
6. Verify all acceptance criteria met
7. Run test coverage report
8. Create PR with story number in title
9. Request code review
10. Merge after approval

**PR Guidelines:**

- Title: `[Story X] Brief description`
- Description: Link to story, list acceptance criteria
- Size: Aim for <400 lines changed (excluding test boilerplate)
- Tests: Include test results in PR
- Screenshots: For UI changes

**Testing Commands:**

```bash
pnpm test                    # Run all tests (Vitest)
pnpm test:coverage           # With coverage report
pnpm test -- Header.test     # Specific test file
pnpm test:e2e                # E2E tests (Playwright)
pnpm test:e2e:ui             # E2E tests with UI
```

---

## Dependencies & Order

**Must Do First:**

- Story 1 (Setup)

**Can Do in Parallel:**

- Stories 3, 4 (after Story 2)
- Stories 5, 6 (after Story 1, 2)

**Must Do Last:**

- Story 7 (requires 2, 3, 4, 6)
- Story 8 (requires all stories)

**Critical Path:**
Story 1 → Story 2 → Stories 3,4,5,6 (parallel) → Story 7 → Story 8

**Estimated Timeline:**

- 1 story per day = ~6 working days
- With parallel work = ~4 working days
- With polish time = ~5 working days total

**Note:** Timeline reduced from original estimate due to existing infrastructure (auth forms, Supabase setup, shadcn components)
