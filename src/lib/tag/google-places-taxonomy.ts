/**
 * Google Places type taxonomy — curated subset for use as system tags.
 *
 * Google's full Table-A type list includes ~100+ entries, many of which are
 * administrative (e.g. `administrative_area_level_3`, `plus_code`) and not
 * useful as human-facing labels. This module ships the subset a creator would
 * plausibly attach to a list or place.
 *
 * Slugs match Google's snake_case identifiers with underscores swapped for
 * hyphens so they fit the platform slug convention. Labels are the
 * human-readable display form.
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/supported_types
 * @see docs/decisions/tags.md
 * @module lib/tag/google-places-taxonomy
 */

/** A single entry in the Google Places system-tag taxonomy. */
export interface TaxonomyEntry {
  /** Normalised slug, e.g. `coffee-shop` */
  slug: string;
  /** Display label, e.g. `Coffee Shop` */
  label: string;
}

/**
 * Curated Google Places types shipped as system default tags.
 * Ordered alphabetically by slug.
 */
export const GOOGLE_PLACES_TAXONOMY: readonly TaxonomyEntry[] = [
  { slug: "amusement-park", label: "Amusement Park" },
  { slug: "aquarium", label: "Aquarium" },
  { slug: "art-gallery", label: "Art Gallery" },
  { slug: "bakery", label: "Bakery" },
  { slug: "bar", label: "Bar" },
  { slug: "beauty-salon", label: "Beauty Salon" },
  { slug: "book-store", label: "Book Store" },
  { slug: "bowling-alley", label: "Bowling Alley" },
  { slug: "brewery", label: "Brewery" },
  { slug: "cafe", label: "Cafe" },
  { slug: "campground", label: "Campground" },
  { slug: "casino", label: "Casino" },
  { slug: "clothing-store", label: "Clothing Store" },
  { slug: "coffee-shop", label: "Coffee Shop" },
  { slug: "department-store", label: "Department Store" },
  { slug: "florist", label: "Florist" },
  { slug: "gym", label: "Gym" },
  { slug: "hair-care", label: "Hair Care" },
  { slug: "hiking-area", label: "Hiking Area" },
  { slug: "hotel", label: "Hotel" },
  { slug: "ice-cream-shop", label: "Ice Cream Shop" },
  { slug: "jewelry-store", label: "Jewelry Store" },
  { slug: "library", label: "Library" },
  { slug: "lodging", label: "Lodging" },
  { slug: "meal-delivery", label: "Meal Delivery" },
  { slug: "meal-takeaway", label: "Meal Takeaway" },
  { slug: "movie-theater", label: "Movie Theater" },
  { slug: "museum", label: "Museum" },
  { slug: "night-club", label: "Night Club" },
  { slug: "park", label: "Park" },
  { slug: "pharmacy", label: "Pharmacy" },
  { slug: "restaurant", label: "Restaurant" },
  { slug: "shoe-store", label: "Shoe Store" },
  { slug: "shopping-mall", label: "Shopping Mall" },
  { slug: "spa", label: "Spa" },
  { slug: "stadium", label: "Stadium" },
  { slug: "store", label: "Store" },
  { slug: "supermarket", label: "Supermarket" },
  { slug: "tourist-attraction", label: "Tourist Attraction" },
  { slug: "winery", label: "Winery" },
  { slug: "zoo", label: "Zoo" },
] as const;

/**
 * Look up a taxonomy entry by slug.
 *
 * @param slug - Normalised slug to search for
 * @returns The matching entry, or undefined if not in the taxonomy
 */
export function findTaxonomyEntry(slug: string): TaxonomyEntry | undefined {
  return GOOGLE_PLACES_TAXONOMY.find((t) => t.slug === slug);
}
