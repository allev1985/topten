import { db } from "../index";
import { categories } from "../schema/category";

const categoryData = [
  { name: "Coffee & Cafés", slug: "coffee-cafes" },
  { name: "Restaurants", slug: "restaurants" },
  { name: "Bars & Nightlife", slug: "bars-nightlife" },
  { name: "Breakfast & Brunch", slug: "breakfast-brunch" },
  { name: "Date Night", slug: "date-night" },
  { name: "Family-Friendly", slug: "family-friendly" },
  { name: "Outdoor & Nature", slug: "outdoor-nature" },
  { name: "Workspaces & Co-working", slug: "workspaces" },
];

export async function seedCategories() {
  console.log("Seeding categories...");

  for (const category of categoryData) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing({ target: categories.slug });
  }

  console.log(`Seeded ${categoryData.length} categories`);
}
