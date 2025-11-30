import type { JSX } from "react";
import { SignupForm } from "./signup-form";

/**
 * Signup page
 * Public page for new user registration
 */
export default function SignupPage(): JSX.Element {
  return (
    <main>
      <SignupForm />
    </main>
  );
}
