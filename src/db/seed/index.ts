import { sql } from "drizzle-orm";
import { db } from "@/db";
import { tags } from "@/db/schema/tag";
import { GOOGLE_PLACES_TAXONOMY } from "@/lib/tag/google-places-taxonomy";

/**
 * Seed system tags from the Google Places taxonomy.
 * Idempotent — re-running upserts on slug and leaves existing rows intact.
 */
async function seedSystemTags(): Promise<void> {
  console.log(`Seeding ${GOOGLE_PLACES_TAXONOMY.length} system tags…`);

  await db
    .insert(tags)
    .values(
      GOOGLE_PLACES_TAXONOMY.map((t) => ({
        slug: t.slug,
        label: t.label,
        isSystem: true,
        userId: null,
      }))
    )
    .onConflictDoNothing({
      target: tags.slug,
    });
  console.log("System tags seeded.");
}

async function main() {
  console.log("Starting database seed...");

  try {
    await seedSystemTags();
    console.log("Database seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exit(1);
  }
}

main();
