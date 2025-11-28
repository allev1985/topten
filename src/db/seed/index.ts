import { seedCategories } from "./categories";

async function main() {
  console.log("Starting database seed...");

  try {
    await seedCategories();
    console.log("Database seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exit(1);
  }
}

main();
