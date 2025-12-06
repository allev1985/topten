import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupModal from "@/components/shared/SignupModal";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock SignupForm to isolate SignupModal tests
vi.mock("@/components/auth/signup-form", () => ({
  SignupForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="mock-signup-form">
      <button onClick={() => onSuccess?.()}>Mock Success</button>
    </div>
  ),
}));

describe("SignupModal - Rendering", () => {
  it("renders dialog when isOpen is true", () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("does not render dialog when isOpen is false", () => {
    render(<SignupModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders SignupForm inside dialog initially", () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("mock-signup-form")).toBeInTheDocument();
  });

  it("displays success message after successful signup", async () => {
    const user = userEvent.setup();
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    // Trigger success via mocked SignupForm
    const successButton = screen.getByText("Mock Success");
    await user.click(successButton);

    // Success message should appear
    expect(screen.getByText("Check your email!")).toBeInTheDocument();
    expect(
      screen.getByText(
        /We've sent you a confirmation link. Click it to verify your account/
      )
    ).toBeInTheDocument();
  });

  it("hides SignupForm when success message is shown", async () => {
    const user = userEvent.setup();
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    // Initially, form is visible
    expect(screen.getByTestId("mock-signup-form")).toBeInTheDocument();

    // Trigger success
    await user.click(screen.getByText("Mock Success"));

    // Form should be hidden
    expect(screen.queryByTestId("mock-signup-form")).not.toBeInTheDocument();
  });
});

describe("SignupModal - Interaction", () => {
  it("calls onClose when dialog requests to close", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<SignupModal isOpen={true} onClose={onClose} />);

    // Press Escape key
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("resets success state when modal closes and reopens", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SignupModal isOpen={true} onClose={vi.fn()} />
    );

    // Trigger success
    await user.click(screen.getByText("Mock Success"));
    expect(screen.getByText("Check your email!")).toBeInTheDocument();

    // Close modal
    rerender(<SignupModal isOpen={false} onClose={vi.fn()} />);

    // Reopen modal
    rerender(<SignupModal isOpen={true} onClose={vi.fn()} />);

    // Should show form again, not success message
    expect(screen.getByTestId("mock-signup-form")).toBeInTheDocument();
    expect(screen.queryByText("Check your email!")).not.toBeInTheDocument();
  });

  it("stays open after successful signup", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<SignupModal isOpen={true} onClose={onClose} />);

    // Trigger success
    await user.click(screen.getByText("Mock Success"));

    // Success message appears but modal doesn't close automatically
    expect(screen.getByText("Check your email!")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("SignupModal - Accessibility", () => {
  it("has proper dialog role", () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  it("includes accessible title", () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("includes accessible description", () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    expect(
      screen.getByText("Start curating your favorite places")
    ).toBeInTheDocument();
  });

  it("provides DialogTitle for screen reader announcements", () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    const title = screen.getByText("Create your account");
    expect(title).toBeInTheDocument();
  });

  it("provides DialogDescription for context", () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    const description = screen.getByText("Start curating your favorite places");
    expect(description).toBeInTheDocument();
  });

  it("success message is accessible", async () => {
    const user = userEvent.setup();
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText("Mock Success"));

    // Success message should be in an alert component
    const successAlert = screen.getByText("Check your email!");
    expect(successAlert).toBeInTheDocument();
  });
});
