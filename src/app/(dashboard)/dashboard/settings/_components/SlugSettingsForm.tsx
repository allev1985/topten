"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SlugSettingsFormProps {
  /** The user's current vanity slug */
  initialSlug: string;
}

/**
 * Display-only section for the user's vanity slug (Profile URL).
 * Changing the profile URL is currently disabled.
 */
export function SlugSettingsForm({ initialSlug }: SlugSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile URL</CardTitle>
        <CardDescription>Your public profile address</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vanitySlug">Your profile URL</Label>
            <Input
              id="vanitySlug"
              type="text"
              value={initialSlug}
              readOnly
              disabled
              autoComplete="off"
              aria-describedby="vanitySlug-hint"
            />
            <p id="vanitySlug-hint" className="text-muted-foreground text-sm">
              Your public page:{" "}
              <span className="font-mono">/{initialSlug}</span>
            </p>
          </div>

          <Button type="button" disabled>
            Cannot change
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        <p>Contact support to change your profile URL.</p>
      </CardFooter>
    </Card>
  );
}
