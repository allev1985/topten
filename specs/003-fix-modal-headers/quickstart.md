# Quick Start: Fix Duplicate Headers in Auth Modals

**Feature**: 003-fix-modal-headers  
**Estimated Time**: 2-3 hours  
**Difficulty**: Low  

## Prerequisites

- Node.js and pnpm installed
- Repository cloned and dependencies installed
- Familiarity with React, TypeScript, and Next.js
- Understanding of component composition patterns

## Implementation Steps

### Step 1: Update LoginForm Component (30 minutes)

**File**: `/src/app/(auth)/login/login-form.tsx`

1. **Add variant prop to interface**:
   ```typescript
   export interface LoginFormProps {
     variant?: "card" | "inline";  // Add this line
     redirectTo?: string;
     defaultEmail?: string;
     onSuccess?: (data: { redirectTo: string }) => void;
   }
   ```

2. **Update component signature** to destructure variant with default:
   ```typescript
   export function LoginForm({
     variant = "card",  // Add with default value
     redirectTo,
     defaultEmail,
     onSuccess,
   }: LoginFormProps) {
   ```

3. **Extract form content** into a variable (before the return statement):
   ```typescript
   const formContent = (
     <form action={formAction} className="space-y-4">
       {/* Move all existing form JSX here */}
       {state.error && (
         <Alert variant="destructive">
           <AlertDescription>{state.error}</AlertDescription>
         </Alert>
       )}
       
       {redirectTo && (
         <input type="hidden" name="redirectTo" value={redirectTo} />
       )}
       
       {/* Email field */}
       <div className="space-y-2">
         {/* ... existing email field code ... */}
       </div>
       
       {/* Password field */}
       <div className="space-y-2">
         {/* ... existing password field code ... */}
       </div>
       
       {/* Remember me checkbox */}
       <div className="flex items-center space-x-2">
         {/* ... existing checkbox code ... */}
       </div>
       
       {/* Submit button */}
       <Button type="submit" disabled={state.isPending} aria-busy={state.isPending}>
         {state.isPending ? "Submitting..." : "Sign In"}
       </Button>
     </form>
   );
   ```

4. **Extract footer content** into a variable:
   ```typescript
   const footerContent = (
     <div className="flex flex-col items-start gap-2">
       <p>
         Don&apos;t have an account? <a href="/signup">Sign up</a>
       </p>
       <p>
         <a href="/forgot-password">Forgot your password?</a>
       </p>
       <hr className="w-full" />
       <p>
         <button type="button" disabled>
           Sign in with Google (coming soon)
         </button>
       </p>
     </div>
   );
   ```

5. **Replace return statement** with conditional rendering:
   ```typescript
   if (variant === "inline") {
     return (
       <div className="space-y-4">
         {formContent}
         {footerContent}
       </div>
     );
   }
   
   return (
     <Card className="w-full max-w-sm">
       <CardHeader>
         <CardTitle>Sign In</CardTitle>
         <CardDescription>
           Enter your credentials to access your account
         </CardDescription>
       </CardHeader>
       <CardContent>{formContent}</CardContent>
       <CardFooter className="flex-col items-start gap-2">
         {footerContent}
       </CardFooter>
     </Card>
   );
   ```

6. **Update JSDoc comment**:
   ```typescript
   /**
    * Login form component
    * Handles authentication with email/password
    * 
    * @param variant - Controls presentation: "card" for standalone pages, "inline" for modals
    */
   ```

### Step 2: Update SignupForm Component (30 minutes)

**File**: `/src/components/auth/signup-form.tsx`

Follow the same pattern as LoginForm:

1. **Add variant prop** to SignupFormProps interface
2. **Update component signature** with variant default value
3. **Extract form content** into variable
4. **Extract footer content** into variable
5. **Replace return** with conditional rendering
6. **Update JSDoc comment**

Note: SignupForm has password strength indicator - keep it in the form content.

### Step 3: Update LoginModal (10 minutes)

**File**: `/src/components/shared/LoginModal.tsx`

Simply add the variant prop to the LoginForm component:

```typescript
<LoginForm 
  variant="inline"  // Add this line
  redirectTo={redirectTo} 
  onSuccess={handleSuccess} 
/>
```

No other changes needed - DialogHeader already provides the modal header.

### Step 4: Update SignupModal (10 minutes)

**File**: `/src/components/shared/SignupModal.tsx`

Simply add the variant prop to the SignupForm component:

```typescript
<SignupForm 
  variant="inline"  // Add this line
  onSuccess={handleSuccess} 
/>
```

No other changes needed - DialogHeader already provides the modal header.

### Step 5: Testing (60-90 minutes)

#### Unit Tests

1. **Create LoginForm tests** (`tests/components/login-form.test.tsx`):
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { LoginForm } from '@/app/(auth)/login/login-form';
   
   describe('LoginForm', () => {
     it('renders with card variant by default', () => {
       render(<LoginForm />);
       // Verify Card components are present
       expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
     });
     
     it('renders with inline variant', () => {
       render(<LoginForm variant="inline" />);
       // Verify Card components are NOT present
       // Verify form fields ARE present
     });
     
     // Add more tests for functionality in both variants
   });
   ```

2. **Create SignupForm tests** (`tests/components/signup-form.test.tsx`):
   - Mirror LoginForm test structure
   - Include password strength indicator tests

3. **Update modal tests** to verify variant prop is passed

#### E2E Tests

Update `tests/e2e/auth-modals.spec.ts`:

```typescript
test('login modal shows single header', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Sign In")');
  
  // Verify only one "Sign In" heading exists
  const headings = await page.locator('h2:has-text("Sign In")').count();
  expect(headings).toBe(1);
});

test('signup modal shows single header', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Sign Up")');
  
  // Verify only one "Create" heading exists
  const headings = await page.locator('h2:has-text("Create")').count();
  expect(headings).toBe(1);
});
```

#### Manual Testing Checklist

- [ ] Navigate to `/login` - verify card styling preserved
- [ ] Navigate to `/signup` - verify card styling preserved
- [ ] Click login button in nav - verify modal shows single header
- [ ] Click signup button in nav - verify modal shows single header
- [ ] Test keyboard navigation (Tab, Enter, Escape) in both contexts
- [ ] Test screen reader announcements with VoiceOver/NVDA
- [ ] Verify all form validation works in both contexts
- [ ] Verify success flows work in both contexts

### Step 6: Documentation (15 minutes)

1. **Update LoginForm JSDoc**:
   - Document variant prop behavior
   - Add usage examples for both contexts

2. **Update SignupForm JSDoc**:
   - Document variant prop behavior
   - Add usage examples for both contexts

3. **Add inline comments** if any complex logic was added

### Step 7: Final Verification (15 minutes)

1. **Run linter**:
   ```bash
   pnpm lint
   ```

2. **Run type checker**:
   ```bash
   pnpm type-check
   ```

3. **Run unit tests**:
   ```bash
   pnpm test
   ```

4. **Run E2E tests**:
   ```bash
   pnpm test:e2e
   ```

5. **Build the project**:
   ```bash
   pnpm build
   ```

6. **Visual comparison**:
   - Take screenshots of before/after states
   - Verify no regressions in standalone pages
   - Verify headers removed in modals

## Common Pitfalls

### 1. Forgetting Default Value
**Problem**: Not setting `variant = "card"` as default breaks existing usage.
**Solution**: Always use default parameter: `variant = "card"`

### 2. Breaking Footer Layout
**Problem**: Footer content loses proper spacing when extracted.
**Solution**: Maintain `className="flex-col items-start gap-2"` on wrapper.

### 3. Losing Accessibility
**Problem**: Removing Card accidentally removes ARIA attributes.
**Solution**: Keep all `aria-*` attributes on form elements, not Card wrapper.

### 4. Incorrect Import Paths
**Problem**: LoginForm is in app directory, SignupForm in components.
**Solution**: 
- LoginForm: `@/app/(auth)/login/login-form`
- SignupForm: `@/components/auth/signup-form`

## Rollback Plan

If issues are discovered after deployment:

1. **Quick rollback** (5 minutes):
   ```typescript
   // In LoginModal.tsx and SignupModal.tsx
   // Remove variant="inline" prop
   <LoginForm redirectTo={redirectTo} onSuccess={handleSuccess} />
   <SignupForm onSuccess={handleSuccess} />
   ```

2. **Revert all changes** if needed:
   ```bash
   git revert <commit-hash>
   ```

## Success Criteria Verification

Before marking complete, verify:

- ✅ Login modal shows only one "Sign In" header
- ✅ Signup modal shows only one "Create your account" header
- ✅ `/login` page shows form as card with header
- ✅ `/signup` page shows form as card with header
- ✅ All form validation works in both contexts
- ✅ All accessibility features work in both contexts
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build succeeds

## Next Steps

After completion:
1. Create pull request with changes
2. Request code review
3. Run CI pipeline
4. Deploy to staging for QA verification
5. Deploy to production

## Resources

- **Spec Document**: `specs/003-fix-modal-headers/spec.md`
- **Research Document**: `specs/003-fix-modal-headers/research.md`
- **Data Model**: `specs/003-fix-modal-headers/data-model.md`
- **Component Contracts**: `specs/003-fix-modal-headers/contracts/component-props.ts`
- **shadcn/ui Dialog**: https://ui.shadcn.com/docs/components/dialog
- **shadcn/ui Card**: https://ui.shadcn.com/docs/components/card

## Getting Help

If you encounter issues:
1. Check the research document for pattern explanations
2. Review the data model for component structure
3. Refer to existing component patterns in the codebase
4. Check TypeScript errors carefully - they often point to the issue
5. Test in isolation - create a minimal reproduction

## Estimated Timeline

| Task | Time | Cumulative |
|------|------|------------|
| LoginForm update | 30 min | 30 min |
| SignupForm update | 30 min | 1 hour |
| Modal updates | 20 min | 1 hour 20 min |
| Unit tests | 45 min | 2 hours 5 min |
| E2E tests | 30 min | 2 hours 35 min |
| Manual testing | 15 min | 2 hours 50 min |
| Documentation | 15 min | 3 hours 5 min |
| Final verification | 15 min | 3 hours 20 min |

**Total**: ~3 hours 20 minutes for experienced developer

---

**Status**: Ready for implementation  
**Last Updated**: 2025-12-06
