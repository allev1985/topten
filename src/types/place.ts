/**
 * Minimal place representation shared across the application.
 * Used as a lean transfer type from the service layer to UI components.
 *
 * @module types/place
 */

/** Minimal place data sufficient to render a place card. */
export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  description: string | null;
  heroImageUrl: string | null;
}
