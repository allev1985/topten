import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import { createClient } from "@/lib/supabase/client";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

describe("DashboardPage - Session Monitoring", () => {
  const mockPush = vi.fn();
  const mockUnsubscribe = vi.fn();
  let mockAuthCallback: ((event: string, session: unknown) => void) | null =
    null;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });

    // Setup Supabase mock
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        onAuthStateChange: vi.fn((callback) => {
          mockAuthCallback = callback;
          return {
            data: {
              subscription: {
                unsubscribe: mockUnsubscribe,
              },
            },
          };
        }),
      },
    });
  });

  afterEach(() => {
    mockAuthCallback = null;
  });

  it("subscribes to auth state changes on mount", () => {
    const supabase = createClient();
    render(<DashboardPage />);
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("redirects to /login on SIGNED_OUT event", () => {
    render(<DashboardPage />);

    // Trigger SIGNED_OUT event
    if (mockAuthCallback) {
      mockAuthCallback("SIGNED_OUT", null);
    }

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when session is null", () => {
    render(<DashboardPage />);

    // Trigger event with null session
    if (mockAuthCallback) {
      mockAuthCallback("TOKEN_REFRESHED", null);
    }

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("does not redirect when session is valid", () => {
    render(<DashboardPage />);

    // Trigger SIGNED_IN with valid session
    if (mockAuthCallback) {
      mockAuthCallback("SIGNED_IN", {
        access_token: "token",
        user: { id: "123" },
      });
    }

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders dashboard content", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Welcome to your dashboard/i)).toBeInTheDocument();
  });

  it("renders desktop sidebar", () => {
    const { container } = render(<DashboardPage />);
    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
  });

  it("renders mobile navigation header", () => {
    const { container } = render(<DashboardPage />);
    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("cleans up auth subscription on unmount", () => {
    const { unmount } = render(<DashboardPage />);
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
