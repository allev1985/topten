/**
 * Type definitions for the Profile Service
 * @module profile/service/types
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
