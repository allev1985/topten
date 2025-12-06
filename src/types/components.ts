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
