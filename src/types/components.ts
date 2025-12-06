/**
 * Component prop types
 */

/**
 * Props for LoginModal component
 */
export interface LoginModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Optional redirect URL after successful login */
  redirectTo?: string;
}

/**
 * Props for SignupModal component
 */
export interface SignupModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * Configuration for a single image in the hero grid
 */
export interface ImageConfig {
  /** Unique identifier for the image */
  id: string;
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Whether to load this image with high priority */
  priority: boolean;
  /** Tailwind CSS classes for grid positioning */
  gridClasses: string;
}
