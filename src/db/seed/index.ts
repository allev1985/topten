import { GOOGLE_PLACES_TYPES } from "@/lib/tag/seed";
import { db } from "@/db";
import { tags } from "@/db/schema/tag";

async function main() {
  console.log("Starting database seed...");

  try {
    // Seed system tags from Google Places taxonomy
    console.log(`Seeding ${GOOGLE_PLACES_TYPES.length} system tags...`);

    for (const name of GOOGLE_PLACES_TYPES) {
      await db
        .insert(tags)
        .values({ name, source: "system" })
        .onConflictDoNothing({ target: tags.name });
    }

    console.log("System tags seeded successfully");
    console.log("Database seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exit(1);
  }
}

main();
