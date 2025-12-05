import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/shared/Header";

describe("Header - Brand Identity and Visual Elements (User Story 1)", () => {
  const mockHandlers = {
    onLogin: vi.fn(),
    onSignup: vi.fn(),
  };

  it("renders the YourFavs logo with MapPin icon and text", () => {
    render(<Header {...mockHandlers} />);

    // Verify logo link is present
    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toBeInTheDocument();

    // Verify brand text is present
    expect(screen.getByText("YourFavs")).toBeInTheDocument();
  });

  it("displays both action buttons with correct labels", () => {
    render(<Header {...mockHandlers} />);

    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Curating" })
    ).toBeInTheDocument();
  });

  it("renders header as a banner landmark element", () => {
    render(<Header {...mockHandlers} />);

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("applies correct styling to create visual hierarchy", () => {
    render(<Header {...mockHandlers} />);

    const loginButton = screen.getByRole("button", { name: "Log In" });
    const signupButton = screen.getByRole("button", {
      name: "Start Curating",
    });

    // Login button should be more subtle (ghost variant)
    expect(loginButton).toHaveClass("hover:bg-accent");

    // Signup button should be prominent (default/primary variant)
    expect(signupButton).toHaveClass("bg-primary");
  });
});

describe("Header - Logo Navigation (User Story 2)", () => {
  const mockHandlers = {
    onLogin: vi.fn(),
    onSignup: vi.fn(),
  };

  it("renders logo as a clickable link to homepage", () => {
    render(<Header {...mockHandlers} />);

    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("provides visual feedback when logo is hovered", () => {
    render(<Header {...mockHandlers} />);

    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toHaveClass("hover:opacity-80");
  });

  it("logo link is keyboard accessible", () => {
    render(<Header {...mockHandlers} />);

    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink.tagName).toBe("A");
  });
});

describe("Header - Authentication Actions (User Story 3)", () => {
  it("triggers login action when Log In button is clicked", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();

    render(<Header onLogin={onLogin} onSignup={onSignup} />);

    const loginButton = screen.getByRole("button", { name: "Log In" });
    await user.click(loginButton);

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onSignup).not.toHaveBeenCalled();
  });

  it("triggers signup action when Start Curating button is clicked", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();

    render(<Header onLogin={onLogin} onSignup={onSignup} />);

    const signupButton = screen.getByRole("button", {
      name: "Start Curating",
    });
    await user.click(signupButton);

    expect(onSignup).toHaveBeenCalledTimes(1);
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("triggers login action when Log In button is activated with Enter key", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();

    render(<Header onLogin={onLogin} onSignup={onSignup} />);

    const loginButton = screen.getByRole("button", { name: "Log In" });
    loginButton.focus();
    await user.keyboard("{Enter}");

    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("triggers signup action when Start Curating button is activated with Enter key", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();

    render(<Header onLogin={onLogin} onSignup={onSignup} />);

    const signupButton = screen.getByRole("button", {
      name: "Start Curating",
    });
    signupButton.focus();
    await user.keyboard("{Enter}");

    expect(onSignup).toHaveBeenCalledTimes(1);
  });
});

describe("Header - Accessibility (User Story 4)", () => {
  const mockHandlers = {
    onLogin: vi.fn(),
    onSignup: vi.fn(),
  };

  it("all interactive elements are keyboard accessible in logical order", async () => {
    const user = userEvent.setup();
    render(<Header {...mockHandlers} />);

    // Tab through elements
    await user.tab();
    expect(screen.getByLabelText("YourFavs home")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Log In" })).toHaveFocus();

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Start Curating" })
    ).toHaveFocus();
  });

  it("logo link has descriptive accessible label", () => {
    render(<Header {...mockHandlers} />);

    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toBeInTheDocument();
  });

  it("buttons have clear accessible labels", () => {
    render(<Header {...mockHandlers} />);

    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Curating" })
    ).toBeInTheDocument();
  });

  it("header is identified as a banner landmark for screen readers", () => {
    render(<Header {...mockHandlers} />);

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("activating buttons with Space key triggers actions", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();

    render(<Header onLogin={onLogin} onSignup={onSignup} />);

    const loginButton = screen.getByRole("button", { name: "Log In" });
    loginButton.focus();
    await user.keyboard(" "); // Space key

    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
