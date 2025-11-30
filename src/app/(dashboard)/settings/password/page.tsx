import type { JSX } from "react";
import { PasswordChangeForm } from "./password-change-form";

/**
 * Password settings page
 * Protected page for authenticated users to change their password
 */
export default function PasswordSettingsPage(): JSX.Element {
  return (
    <main>
      <article>
        <header>
          <h1>Change Password</h1>
          <p>Update your account password</p>
        </header>
        <section>
          <PasswordChangeForm />
        </section>
        <footer>
          <p>
            <a href="/dashboard">Back to Dashboard</a>
          </p>
        </footer>
      </article>
    </main>
  );
}
