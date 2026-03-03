import { redirect } from "next/navigation";
import type { JSX } from "react";
import { getSession } from "@/lib/auth/service";
import { getProfileForSettings } from "@/lib/profile/service";
import { SlugSettingsForm } from "./_components/SlugSettingsForm";
import { NameSettingsForm } from "./_components/NameSettingsForm";
import { PasswordChangeForm } from "./password/password-change-form";

/**
 * Settings page — single unified page for profile and security settings.
 * Renders three independently submittable sections:
 *   1. Profile URL (vanity slug)
 *   2. Profile (display name)
 *   3. Security (password change — reuses existing PasswordChangeForm)
 *
 * Authentication protection is provided by middleware covering /dashboard.
 */
export default async function SettingsPage(): Promise<JSX.Element> {
  const sessionResult = await getSession();

  if (!sessionResult.authenticated || !sessionResult.user?.id) {
    redirect("/login");
  }

  const currentUserId = sessionResult.user.id;

  const profile = await getProfileForSettings(currentUserId);

  if (!profile) {
    // Edge case: authenticated but no application profile yet.
    // Redirect to login to trigger profile creation flow.
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and account security
        </p>
      </header>

      <section aria-labelledby="profile-url-heading">
        <h2 id="profile-url-heading" className="sr-only">
          Profile URL
        </h2>
        <SlugSettingsForm initialSlug={profile.vanitySlug} />
      </section>

      <section aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="sr-only">
          Profile
        </h2>
        <NameSettingsForm initialName={profile.name} />
      </section>

      <section aria-labelledby="security-heading">
        <h2 id="security-heading" className="sr-only">
          Security
        </h2>
        <PasswordChangeForm />
      </section>
    </div>
  );
}
