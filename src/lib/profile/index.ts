/**
 * Profile Service public API
 * @module lib/profile
 */

export {
  getProfileForSettings,
  updateName,
  updateSlug,
  isSlugAvailable,
} from "./service";

export { ProfileServiceError } from "./errors";

export type {
  UpdateNameResult,
  UpdateSlugResult,
  SettingsProfile,
} from "./types";
