/**
 * Type definitions for the Profile Service
 * @module lib/profile/types
 */

/**
 * Result of a successful name update
 */
export interface UpdateNameResult {
  /** The saved display name value */
  name: string;
}

/**
 * Result of a successful slug update
 */
export interface UpdateSlugResult {
  /** The saved vanity slug value */
  vanitySlug: string;
}

/**
 * Profile data needed for the settings page
 */
export interface SettingsProfile {
  /** The user's display name */
  name: string;
  /** The user's vanity slug for their profile URL */
  vanitySlug: string;
}
