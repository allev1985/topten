"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "@/hooks/use-form-state";
import { verifyMFAAction, sendMFACodeAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VerifyMFAFormProps {
  redirectTo: string;
}

/**
 * MFA verification form.
 * Auto-sends the email code on mount, then prompts the user to enter it.
 */
export function VerifyMFAForm({ redirectTo }: VerifyMFAFormProps) {
  const router = useRouter();
  const { state, formAction } = useFormState(verifyMFAAction);
  const [sendError, setSendError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [resending, setResending] = useState(false);

  // Auto-send the code when the page first mounts
  useEffect(() => {
    sendMFACodeAction().then((result) => {
      if (result.error) {
        setSendError(result.error);
      } else {
        setCodeSent(true);
      }
    });
  }, []);

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      router.push(state.data.redirectTo);
    }
  }, [state.isSuccess, state.data, router]);

  const handleResend = async () => {
    setResending(true);
    setSendError(null);
    const result = await sendMFACodeAction();
    if (result.error) {
      setSendError(result.error);
    } else {
      setCodeSent(true);
    }
    setResending(false);
  };

  return (
    <div className="space-y-5">
      {sendError && (
        <Alert variant="destructive">
          <AlertDescription>{sendError}</AlertDescription>
        </Alert>
      )}

      {codeSent && !sendError && (
        <p className="text-muted-foreground text-sm">
          A 6-digit code has been sent to your email address.
        </p>
      )}

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            placeholder="000000"
            className="text-center font-mono text-lg tracking-widest"
            aria-invalid={state.fieldErrors.code?.[0] ? "true" : undefined}
            aria-describedby={
              state.fieldErrors.code?.[0] ? "code-error" : undefined
            }
          />
          {state.fieldErrors.code?.[0] && (
            <span
              id="code-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {state.fieldErrors.code[0]}
            </span>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={state.isPending}
          aria-busy={state.isPending}
        >
          {state.isPending ? "Verifying…" : "Verify"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Didn&apos;t receive a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-foreground underline underline-offset-4 disabled:opacity-50"
        >
          {resending ? "Sending…" : "Send again"}
        </button>
      </p>
    </div>
  );
}
