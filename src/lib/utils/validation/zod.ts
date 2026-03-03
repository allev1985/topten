/**
 * Shared Zod utility helpers for server actions
 */

/**
 * Maps Zod issue list to the `fieldErrors` shape expected by `ActionState<T>`.
 *
 * @param issues - Array of Zod validation issues
 * @returns Record mapping field path (dot-joined) to array of error messages
 */
export function mapZodErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string[]> {
  return issues.reduce(
    (acc, issue) => {
      const field = issue.path.map(String).join(".");
      if (!acc[field]) acc[field] = [];
      acc[field].push(issue.message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}
