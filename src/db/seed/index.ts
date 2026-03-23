import { db } from "@/db";
import { tags } from "@/db/schema/tag";
import { SYSTEM_TAG_TAXONOMY } from "@/lib/tag/system-tags";

/**
 * Seed system tags from the built-in taxonomy.
 * Idempotent — re-running upserts on slug and leaves existing rows intact.
 */
async function seedSystemTags(): Promise<void> {
  console.log(`Seeding ${SYSTEM_TAG_TAXONOMY.length} system tags…`);

  await db
    .insert(tags)
    .values(
      SYSTEM_TAG_TAXONOMY.map((t) => ({
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
