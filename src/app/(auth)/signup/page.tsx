import type { JSX } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./signup-form";

/**
 * Signup page
 * Public page for new user registration
 */
export default function SignupPage(): JSX.Element {
  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Enter your email and password to sign up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
        <CardFooter>
          <p>
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
