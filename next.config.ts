import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Remove the X-Powered-By: Next.js header — minor information disclosure
  // that helps attackers fingerprint the stack.
  poweredByHeader: false,

  // pino and thread-stream use Node.js-only APIs (worker_threads, fs) that
  // cannot be bundled for the browser. Marking them as server-external tells
  // Next.js / Turbopack to leave them as native require() calls at runtime
  // instead of attempting to bundle them into the client graph.
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],

  // ---------------------------------------------------------------------------
  // Security headers — applied to every response.
  //
  // Headers are split into two groups:
  //   1. Enforced immediately  — safe to apply now; no risk of breaking pages.
  //   2. CSP (report-only)     — observe violations before enforcing.
  //
  // CSP enforcement path:
  //   Step 1 (now)    — Content-Security-Policy-Report-Only to identify violations.
  //   Step 2 (TODO)   — Generate a per-request nonce in proxy.ts, thread it through
  //                     to next/script and inline <script> tags, then replace
  //                     'unsafe-inline' with 'nonce-{nonce}' in script-src.
  //   Step 3 (TODO)   — Promote to Content-Security-Policy once violation count
  //                     in devtools (or a report-uri endpoint) reaches zero.
  //
  // @see docs/security-auth-review.md — Critical Issue #1
  // ---------------------------------------------------------------------------
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ------------------------------------------------------------------
          // Group 1 — Enforced immediately
          // ------------------------------------------------------------------

          // Prevent browsers from MIME-sniffing a response away from the declared
          // content-type (e.g. serving a script from an image URL).
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // Deny all framing — prevents clickjacking on login/settings pages.
          // Superseded by CSP frame-ancestors once CSP is promoted to enforced,
          // but kept here for defence-in-depth during the report-only phase.
          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          // For cross-origin requests send only the origin (no path/query string).
          // This prevents password-reset tokens in query params leaking to
          // third-party resources (e.g. Google Fonts) via the Referer header.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // Disable browser features this app does not use.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },

          // Tell browsers to use HTTPS for all future requests to this origin.
          // max-age=1 year; includeSubDomains ensures subdomains are covered.
          // Do NOT add 'preload' until the domain is submitted to and accepted
          // by the HSTS preload list (https://hstspreload.org) — premature
          // preloading can make a domain permanently inaccessible over HTTP.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },

          // ------------------------------------------------------------------
          // Group 2 — Content-Security-Policy (report-only)
          //
          // 'unsafe-inline' in script-src is required for now because Next.js
          // App Router emits inline <script> tags for RSC payloads and
          // hydration data. These cannot be removed without a nonce — see the
          // enforcement path in the comment block above.
          //
          // Image origins mirror the remotePatterns defined below so both lists
          // stay in sync. placehold.co should be removed from both once the
          // production gate (see TODO in remotePatterns) is implemented.
          //
          // To capture violation reports centrally, add:
          //   "report-uri https://your-csp-reporter/endpoint"
          // or the modern equivalent:
          //   "report-to csp-endpoint"
          // ------------------------------------------------------------------
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              // 'unsafe-inline' required until nonce infra is in place (Step 2).
              "script-src 'self' 'unsafe-inline'",
              // Google Fonts delivers its CSS from fonts.googleapis.com.
              // Tailwind and shadcn/ui styles are bundled, so no other external
              // stylesheet origin is needed.
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Google Fonts serves the actual font binary files from gstatic.
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + data URIs (SVG placeholders) + Google Places CDNs.
              "img-src 'self' data: https://maps.googleapis.com https://lh3.googleusercontent.com https://streetviewpixels-pa.googleapis.com https://placehold.co",
              // API and WebSocket connections — self only (Google Places is
              // called server-side; no client-side fetch to external hosts).
              "connect-src 'self'",
              // No iframes anywhere in the app.
              "frame-src 'none'",
              // Deny all framing of this app (mirrors X-Frame-Options above).
              "frame-ancestors 'none'",
              // Restrict <base> to same origin to prevent base-tag injection.
              "base-uri 'self'",
              // All form submissions must target this origin.
              "form-action 'self'",
              // No Flash, Java, or other plugins.
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/@:vanitySlug",
        destination: "/profiles/:vanitySlug",
      },
      {
        source: "/@:vanitySlug/lists/:listSlug",
        destination: "/profiles/:vanitySlug/lists/:listSlug",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        // NOTE: placehold.co is for development/testing only.
        // TODO: Gate this entry to non-production environments in a follow-up
        // (process.env.NODE_ENV !== 'production') to prevent the placeholder
        // domain from being active in production builds.
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        // Google Places Photos API — primary domain for place hero images.
        // Place photo URLs returned by the Places API are served from this host.
        // See: https://developers.google.com/maps/documentation/places/web-service/place-photos
        protocol: "https",
        hostname: "maps.googleapis.com",
        port: "",
        pathname: "/maps/api/place/photo**",
      },
      {
        // Google user-generated content CDN — serves place photos and user
        // avatars that originate from Google Maps contributions. URLs are
        // returned by the Places API as photo references after resolution.
        // Paths vary: /photos/**, /place-photos/**, etc.
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        // Google Street View and additional Places imagery.
        // Some place hero images are served via streetviewpixels CDN.
        protocol: "https",
        hostname: "streetviewpixels-pa.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
