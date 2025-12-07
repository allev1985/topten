import type { List } from "@/types/list";

/**
 * Mock list data for dashboard development
 *
 * TODO: Replace with real data from database in future implementation
 * This mock data will be replaced when integrating with Supabase/Drizzle ORM
 *
 * Mock data includes:
 * - Mix of published (3) and draft (2) lists
 * - Various place counts (0, 1, 8, 12, 15) for testing pluralization
 * - Long title (item 2) for truncation testing
 * - Placeholder images from placehold.co
 */
export const mockLists: List[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Best Coffee Shops in San Francisco",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: true,
    placeCount: 12,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Hidden Gem Restaurants You Must Try Before They Get Too Popular",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: false,
    placeCount: 8,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "Weekend Brunch Spots",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: true,
    placeCount: 1,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    title: "Craft Beer Bars Downtown",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: true,
    placeCount: 15,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    title: "New Places to Explore",
    heroImageUrl: "https://placehold.co/600x400/png",
    isPublished: false,
    placeCount: 0,
  },
];
