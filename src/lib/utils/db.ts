/**
 * Database utility helpers shared across service layers.
 * @module utils/db
 */

/**
 * Returns true when the postgres.js driver error represents a unique-constraint
 * violation (code 23505). Used to detect race-condition slug conflicts.
 */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}
