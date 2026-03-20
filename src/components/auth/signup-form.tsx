"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormState } from "@/hooks/use-form-state";
import { signupAction } from "@/actions/auth-actions";
import { checkSlugAvailabilityAction } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validatePassword } from "@/lib/utils/validation/password";
import { config } from "@/lib/config/client";

type SlugStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid_format";

// Derive display prefix from app URL: "https://myfaves.app" → "myfaves.app/@"
function getSlugPrefix(): string {
  try {
    return new URL(config.appUrl).host + "/@";
  } catch {
    return "@";
  }
}

const SLUG_PREFIX = getSlugPrefix();

/**
 * Signup form client component
 * Full-page signup with name, email, password, confirm password, and profile URL fields.
 * Includes real-time slug availability check.
 */
export function SignupForm() {
  const router = useRouter();
  const { state, formAction } = useFormState(signupAction);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState<"weak" | "medium" | "strong">(
    "weak"
  );
  const [hasPasswordInput, setHasPasswordInput] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSlugRef = useRef<string>("");

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      router.push(state.data.redirectTo);
    }
  }, [state.isSuccess, state.data, router]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    };
  }, []);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setHasPasswordInput(value.length > 0);
    if (value.length > 0) {
      const result = validatePassword(value);
      setStrength(result.strength);
    }
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    currentSlugRef.current = value;

    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);

    if (value.length < 2) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");

    slugTimerRef.current = setTimeout(async () => {
      try {
        const result = await checkSlugAvailabilityAction(value);
        if (value !== currentSlugRef.current) return;
        if (result.available) {
          setSlugStatus("available");
        } else {
          setSlugStatus(
            result.reason === "invalid_format" ? "invalid_format" : "taken"
          );
        }
      } catch {
        if (value !== currentSlugRef.current) return;
        setSlugStatus("idle");
      }
    }, 500);
  };

  const isSubmitDisabled =
    state.isPending ||
    slugStatus === "taken" ||
    slugStatus === "invalid_format" ||
    passwordMismatch;

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Jane Smith"
          aria-invalid={state.fieldErrors.name?.[0] ? "true" : undefined}
          aria-describedby={
            state.fieldErrors.name?.[0] ? "name-error" : undefined
          }
        />
        {state.fieldErrors.name?.[0] && (
          <span
            id="name-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {state.fieldErrors.name[0]}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={state.fieldErrors.email?.[0] ? "true" : undefined}
          aria-describedby={
            state.fieldErrors.email?.[0] ? "email-error" : undefined
          }
        />
        {state.fieldErrors.email?.[0] && (
          <span
            id="email-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {state.fieldErrors.email[0]}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Create a strong password"
          onChange={handlePasswordChange}
          aria-invalid={state.fieldErrors.password?.[0] ? "true" : undefined}
          aria-describedby={
            [
              state.fieldErrors.password?.[0] ? "password-error" : null,
              hasPasswordInput ? "password-strength" : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {hasPasswordInput && (
          <span
            id="password-strength"
            aria-live="polite"
            className="text-muted-foreground text-sm"
          >
            Password strength: {strength}
          </span>
        )}
        {state.fieldErrors.password?.[0] && (
          <span
            id="password-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {state.fieldErrors.password[0]}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={passwordMismatch ? "true" : undefined}
          aria-describedby={
            passwordMismatch ? "confirm-password-error" : undefined
          }
        />
        {passwordMismatch && (
          <span
            id="confirm-password-error"
            role="alert"
            className="text-destructive text-sm"
          >
            Passwords do not match
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vanitySlug">Profile URL</Label>
        <div className="flex items-center">
          <span className="text-muted-foreground bg-muted border-input inline-flex h-9 items-center rounded-l-md border border-r-0 px-3 text-sm select-none">
            {SLUG_PREFIX}
          </span>
          <Input
            id="vanitySlug"
            name="vanitySlug"
            type="text"
            required
            autoComplete="off"
            placeholder="your-name"
            className="rounded-l-none"
            onChange={handleSlugChange}
            aria-invalid={
              state.fieldErrors.vanitySlug?.[0] ||
              slugStatus === "taken" ||
              slugStatus === "invalid_format"
                ? "true"
                : undefined
            }
            aria-describedby="slug-hint slug-status"
          />
        </div>
        <span id="slug-status" aria-live="polite" className="text-sm">
          {slugStatus === "checking" && (
            <span className="text-muted-foreground">
              Checking availability…
            </span>
          )}
          {slugStatus === "available" && (
            <span className="text-green-600">Available</span>
          )}
          {slugStatus === "taken" && (
            <span className="text-destructive">This URL is already taken</span>
          )}
          {slugStatus === "invalid_format" && (
            <span className="text-destructive">
              Use only lowercase letters, numbers, and hyphens
            </span>
          )}
        </span>
        {state.fieldErrors.vanitySlug?.[0] && (
          <span role="alert" className="text-destructive text-sm">
            {state.fieldErrors.vanitySlug[0]}
          </span>
        )}
        <p id="slug-hint" className="text-muted-foreground text-xs">
          Lowercase letters, numbers, and hyphens only. This becomes your public
          profile URL.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitDisabled}
        aria-busy={state.isPending}
      >
        {state.isPending ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground">
          Sign in
        </Link>
      </p>
    </form>
  );
}
