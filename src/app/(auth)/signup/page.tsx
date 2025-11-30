import type { JSX } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "./signup-form";

/**
 * Signup page
 * Public page for new user registration
 */
export default function SignupPage(): JSX.Element {
  return (
    <AuthCard
      title="Create Account"
      description="Enter your email and password to sign up"
      footer={
        <p>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
