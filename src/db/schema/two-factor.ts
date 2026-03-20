import { pgTable, text, index } from "drizzle-orm/pg-core";
import { users } from "./user";

/**
 * Two-factor authentication table — managed by BetterAuth twoFactor plugin.
 *
 * Required by the plugin's Drizzle adapter. For OTP-only MFA flows the
 * `secret` and `backupCodes` columns are not used; they exist to satisfy the
 * plugin's schema contract.
 */
export const twoFactors = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    index("two_factor_secret_idx").on(table.secret),
    index("two_factor_user_id_idx").on(table.userId),
  ]
);
