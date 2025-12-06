# Next.js Image Configuration Contract

**Feature**: 001-dialog-component-setup  
**Date**: 2025-12-04  
**Version**: 1.0.0

## Overview

This document defines the configuration for enabling external placeholder images from placehold.co in Next.js. This configuration is required for development and testing purposes to display realistic page layouts before final content is available.

---

## Configuration Location

**File**: `next.config.ts` (repository root)

**Type**: TypeScript configuration file for Next.js 16.x

---

## Remote Image Pattern Configuration

### Configuration Code

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

### Configuration Properties

| Property   | Value            | Type                | Required | Description                                               |
| ---------- | ---------------- | ------------------- | -------- | --------------------------------------------------------- |
| `protocol` | `'https'`        | `'http' \| 'https'` | Yes      | Protocol for image requests (placehold.co requires HTTPS) |
| `hostname` | `'placehold.co'` | `string`            | Yes      | Exact domain name (no wildcards, no subdomains)           |
| `port`     | `''`             | `string`            | Yes      | Port number or empty string for default (443 for HTTPS)   |
| `pathname` | `'/**'`          | `string`            | Yes      | Path pattern using wildcard syntax (`/**` = all paths)    |

---

## URL Pattern Matching

### Allowed URLs (Examples)

The configuration above allows the following placehold.co URLs:

```typescript
// Basic dimensions
"https://placehold.co/400"; // ✅ Square 400x400
"https://placehold.co/600x400"; // ✅ Landscape 600x400
"https://placehold.co/400x600"; // ✅ Portrait 400x600

// With query parameters
"https://placehold.co/400x300?text=Hello"; // ✅ Custom text
"https://placehold.co/600x400?font=roboto"; // ✅ Custom font
"https://placehold.co/400/png"; // ✅ Specific format
"https://placehold.co/400x300/orange/white"; // ✅ Custom colors

// With file extensions (placehold.co supports)
"https://placehold.co/400x300.png"; // ✅ PNG format
"https://placehold.co/400x300.jpg"; // ✅ JPEG format
"https://placehold.co/400x300.webp"; // ✅ WebP format
```

### Blocked URLs (Examples)

The following URLs will be blocked:

```typescript
// Wrong protocol
"http://placehold.co/400"; // ❌ HTTP instead of HTTPS

// Different domain
"https://via.placeholder.com/400"; // ❌ Different service
"https://subdomain.placehold.co/400"; // ❌ Subdomain not allowed

// Non-default port
"https://placehold.co:8080/400"; // ❌ Non-empty port
```

---

## Usage with Next.js Image Component

### Basic Image Usage

```tsx
import Image from "next/image";

export function PlaceholderExample() {
  return (
    <Image
      src="https://placehold.co/600x400"
      alt="Placeholder image"
      width={600}
      height={400}
    />
  );
}
```

### With Styling

```tsx
import Image from "next/image";

export function StyledPlaceholder() {
  return (
    <Image
      src="https://placehold.co/400x300"
      alt="Coffee shop placeholder"
      width={400}
      height={300}
      className="rounded-lg shadow-md"
    />
  );
}
```

### Responsive Images

```tsx
import Image from "next/image";

export function ResponsivePlaceholder() {
  return (
    <div className="relative aspect-video w-full">
      <Image
        src="https://placehold.co/1200x675"
        alt="Hero image placeholder"
        fill
        className="rounded-lg object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
```

### With Custom Text

```tsx
import Image from "next/image";

export function CustomTextPlaceholder({ text }: { text: string }) {
  const encodedText = encodeURIComponent(text);

  return (
    <Image
      src={`https://placehold.co/400x300?text=${encodedText}`}
      alt={text}
      width={400}
      height={300}
    />
  );
}
```

---

## Common Placeholder Patterns for TopTen

### List Hero Images

```tsx
// Landscape hero for list pages
<Image
  src="https://placehold.co/1200x600?text=Coffee+Shops"
  alt="List hero image"
  width={1200}
  height={600}
  className="h-auto w-full"
/>
```

### Place Thumbnails

```tsx
// Square thumbnails for place cards
<Image
  src="https://placehold.co/300?text=Place+Name"
  alt="Place thumbnail"
  width={300}
  height={300}
  className="rounded-md"
/>
```

### Creator Profile Images

```tsx
// Square avatar for creator profiles
<Image
  src="https://placehold.co/200?text=@username"
  alt="Creator avatar"
  width={200}
  height={200}
  className="rounded-full"
/>
```

### Category Banners

```tsx
// Wide banner for category pages
<Image
  src="https://placehold.co/1920x400?text=Restaurants"
  alt="Category banner"
  width={1920}
  height={400}
  className="h-auto w-full"
/>
```

---

## Build-Time Validation

### Successful Build

When configuration is correct:

```bash
$ pnpm build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

### Configuration Errors

#### Missing Protocol

```typescript
// ❌ BAD - Missing protocol
images: {
  remotePatterns: [
    {
      // protocol: 'https',  // Missing!
      hostname: 'placehold.co',
      pathname: '/**',
    },
  ],
},

// Error:
// Type '{ hostname: string; pathname: string; }' is missing the following
// properties from type 'RemotePattern': protocol
```

#### Invalid Protocol

```typescript
// ❌ BAD - Invalid protocol value
images: {
  remotePatterns: [
    {
      protocol: 'ftp',  // Invalid!
      hostname: 'placehold.co',
      pathname: '/**',
    },
  ],
},

// Error:
// Type '"ftp"' is not assignable to type '"http" | "https"'
```

#### Missing Hostname

```typescript
// ❌ BAD - Missing hostname
images: {
  remotePatterns: [
    {
      protocol: 'https',
      // hostname: 'placehold.co',  // Missing!
      pathname: '/**',
    },
  ],
},

// Error:
// Property 'hostname' is missing in type '{ protocol: string; pathname: string; }'
```

---

## Runtime Behavior

### Authorized Image Load

```tsx
<Image src="https://placehold.co/400x300" ... />
```

**Browser Network Tab**:

```
Request URL: https://placehold.co/400x300
Status: 200 OK
Content-Type: image/png
```

**Result**: ✅ Image loads and displays correctly

---

### Unauthorized Image Load

```tsx
<Image src="https://unauthorized-domain.com/image.jpg" ... />
```

**Browser Console**:

```
Warning: Invalid src prop (https://unauthorized-domain.com/image.jpg) on `next/image`,
hostname "unauthorized-domain.com" is not configured under images in your `next.config.js`

See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host
```

**Result**: ❌ Image fails to load, broken image placeholder shown

---

## Development vs Production

### Development Environment

- Placeholder images load from placehold.co
- Network requests visible in DevTools
- Useful for layout/design iteration

### Production Environment

**Important**: The `remotePatterns` configuration is **build-time only**. It does not require placehold.co to be accessible at runtime.

However:

- ⚠️ **Do not ship placeholder images to production**
- ⚠️ Replace all `placehold.co` URLs with actual content before production deploy
- ℹ️ Consider adding linting rule to detect placehold.co URLs in production builds

**Recommended Lint Rule** (optional):

```javascript
// eslint-custom-rule.js
// Warn if placehold.co found in production code
if (process.env.NODE_ENV === "production") {
  // Check for placehold.co in Image src props
}
```

---

## Testing Strategy

### Unit Test: Image Component Renders

```typescript
// tests/unit/components/placeholder-image.test.tsx
import { render, screen } from '@testing-library/react';
import Image from 'next/image';

test('renders placeholder image', () => {
  render(
    <Image
      src="https://placehold.co/400x300"
      alt="Test placeholder"
      width={400}
      height={300}
    />
  );

  const img = screen.getByAltText('Test placeholder');
  expect(img).toBeInTheDocument();
  expect(img).toHaveAttribute('src');
});
```

### E2E Test: Image Loads in Browser

```typescript
// tests/e2e/image-loading.spec.ts
import { test, expect } from "@playwright/test";

test("placeholder images load correctly", async ({ page }) => {
  await page.goto("/test-page-with-placeholders");

  const image = page.locator('img[src*="placehold.co"]').first();
  await expect(image).toBeVisible();

  // Verify image actually loaded (not broken)
  const isComplete = await image.evaluate(
    (img: HTMLImageElement) => img.complete && img.naturalHeight !== 0
  );
  expect(isComplete).toBe(true);
});
```

### Build Test: Configuration Valid

```bash
# In CI/CD pipeline
pnpm build

# Should exit with code 0 (success)
echo $?  # Expected: 0
```

---

## Security Considerations

### Why `remotePatterns` Instead of `domains`

**Old approach** (deprecated):

```typescript
images: {
  domains: ['placehold.co'],  // DEPRECATED
}
```

**New approach** (recommended):

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'placehold.co', pathname: '/**' }
  ],
}
```

**Advantages of `remotePatterns`**:

1. ✅ **Protocol enforcement**: Only HTTPS allowed, prevents HTTP downgrade attacks
2. ✅ **Path restrictions**: Can limit to specific paths (e.g., `/api/images/**`)
3. ✅ **Port control**: Prevents non-standard ports
4. ✅ **No subdomain wildcards**: `placehold.co` doesn't match `evil.placehold.co`

### Preventing Abuse

**Risk**: Attackers could inject URLs to unauthorized external domains

**Mitigation**:

1. ✅ Next.js validates URLs at runtime (fails if not in `remotePatterns`)
2. ✅ TypeScript ensures configuration correctness at build time
3. ✅ No dynamic domain addition (configuration is static)

**Example Attack Prevention**:

```tsx
// User input (malicious)
const userImageUrl = "https://evil.com/malware.jpg";

// Next.js Image component
<Image src={userImageUrl} ... />

// Result: ❌ Image fails to load (not in remotePatterns)
// Console warning: Invalid src prop
```

---

## Troubleshooting

### Problem: Images Not Loading

**Symptom**: Broken image icon, console warning about unconfigured host

**Solution**:

1. Verify `next.config.ts` has correct `remotePatterns` syntax
2. Check protocol is `'https'` (not `'http'`)
3. Verify hostname is exact match: `'placehold.co'` (no `www.`)
4. Restart Next.js dev server after config changes

### Problem: TypeScript Errors in next.config.ts

**Symptom**: Type errors when editing configuration

**Solution**:

1. Ensure `import type { NextConfig } from "next";` at top of file
2. Verify all required properties (`protocol`, `hostname`, `pathname`) present
3. Use string literals for `protocol`: `'http' | 'https'`

### Problem: Images Load in Dev but Not Production

**Symptom**: Images work in `pnpm dev` but fail in `pnpm build && pnpm start`

**Solution**:

1. Verify `next.config.ts` is committed to Git (not in `.gitignore`)
2. Check production environment has network access to placehold.co (if using at runtime)
3. Ensure build process doesn't override `next.config.ts`

---

## Adding Additional External Domains

To allow images from other external domains:

```typescript
images: {
  remotePatterns: [
    // Placeholder images (development)
    {
      protocol: 'https',
      hostname: 'placehold.co',
      pathname: '/**',
    },
    // Google Places API images (production)
    {
      protocol: 'https',
      hostname: 'maps.googleapis.com',
      pathname: '/maps/api/place/photo/**',
    },
    // User-uploaded images (Supabase Storage)
    {
      protocol: 'https',
      hostname: 'your-project.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

**Best Practice**: Add domains as needed, document purpose of each pattern

---

## Version History

| Version | Date       | Changes                                                       |
| ------- | ---------- | ------------------------------------------------------------- |
| 1.0.0   | 2025-12-04 | Initial Next.js image configuration contract for placehold.co |

---

## Related Documentation

- **Quickstart Guide**: `quickstart.md` (Usage examples)
- **Research**: `research.md` (R2: Next.js Image Domain Configuration)
- **Next.js Docs**: https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
- **placehold.co Docs**: https://placehold.co/
