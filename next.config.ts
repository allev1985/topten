import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        // Google Places Photos API — primary domain for place hero images.
        // Place photo URLs returned by the Places API are served from this host.
        // See: https://developers.google.com/maps/documentation/places/web-service/place-photos
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/place/photo**',
      },
      {
        // Google user-generated content CDN — serves place photos and user
        // avatars that originate from Google Maps contributions. URLs are
        // returned by the Places API as photo references after resolution.
        // Paths vary: /photos/**, /place-photos/**, etc.
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        // Google Street View and additional Places imagery.
        // Some place hero images are served via streetviewpixels CDN.
        protocol: 'https',
        hostname: 'streetviewpixels-pa.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
