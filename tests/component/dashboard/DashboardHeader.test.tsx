import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

describe("DashboardHeader", () => {
  describe("User Story 4: View Dashboard Header and Initiate List Creation", () => {
    it("renders 'My Lists' heading (h1)", () => {
      render(<DashboardHeader />);

      const heading = screen.getByRole("heading", {
        level: 1,
        name: /my lists/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders subtitle text", () => {
      render(<DashboardHeader />);

      expect(
        screen.getByText(/manage and organize your curated collections/i)
      ).toBeInTheDocument();
    });

    it("'+ New List' button renders and is clickable", () => {
      render(<DashboardHeader />);

      const button = screen.getByRole("button", { name: /new list/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("clicking '+ New List' calls onNewList callback", async () => {
      const onNewList = vi.fn();
      const user = userEvent.setup();

      render(<DashboardHeader onNewList={onNewList} />);

      const button = screen.getByRole("button", { name: /new list/i });
      await user.click(button);

      expect(onNewList).toHaveBeenCalledOnce();
    });

    it("header layout is responsive on mobile", () => {
      const { container } = render(<DashboardHeader />);

      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();

      // Check for responsive flexbox layout
      const flexContainer = header?.querySelector(".flex");
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toHaveClass("items-start", "justify-between");
    });
  });
});
