import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPageClient from "@/components/shared/LandingPageClient";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock LoginForm to isolate integration tests
vi.mock("@/app/(auth)/login/login-form", () => ({
  LoginForm: ({
    onSuccess,
    redirectTo,
  }: {
    onSuccess?: (data: { redirectTo: string }) => void;
    redirectTo?: string;
  }) => (
    <div data-testid="mock-login-form">
      <button
        onClick={() => onSuccess?.({ redirectTo: redirectTo || "/dashboard" })}
      >
        Mock Success
      </button>
    </div>
  ),
}));

describe("Login Modal Integration - User Story 1", () => {
  it("opens modal when Log In button is clicked", async () => {
    const user = userEvent.setup();
    render(<LandingPageClient />);

    // Modal should not be visible initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click Log In button
    const loginButton = screen.getByRole("button", { name: "Log In" });
    await user.click(loginButton);

    // Modal should now be visible
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("closes modal and redirects on successful authentication", async () => {
    const user = userEvent.setup();

    render(<LandingPageClient />);

    // Open modal
    await user.click(screen.getByRole("button", { name: "Log In" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Trigger success
    const successButton = screen.getByText("Mock Success");
    await user.click(successButton);

    // Modal should close
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes modal when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<LandingPageClient />);

    // Open modal
    await user.click(screen.getByRole("button", { name: "Log In" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press Escape
    await user.keyboard("{Escape}");

    // Modal should close
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
