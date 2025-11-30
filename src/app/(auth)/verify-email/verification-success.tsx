"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VerificationSuccessProps {
  message: string;
  redirectTo: string;
}

/**
 * VerificationSuccess component
 * Displays success message and redirects to dashboard after delay
 */
export function VerificationSuccess({
  message,
  redirectTo,
}: VerificationSuccessProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, 2000);
    return () => clearTimeout(timer);
  }, [router, redirectTo]);

  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Email Verified!</CardTitle>
          <CardDescription>Your account is now active</CardDescription>
        </CardHeader>
        <CardContent>
          <p role="status">{message}</p>
          <p className="text-muted-foreground text-sm">
            Redirecting to dashboard...
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
