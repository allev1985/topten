import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListCard } from "@/components/dashboard/ListCard";
import type { ListSummary } from "@/lib/list/types";

const mockPublishedList: ListSummary = {
  id: "test-id-1",
  title: "Test Published List",
  slug: "a1b2",
  description: "The best coffee spots in the city.",
  isPublished: true,
  placeCount: 5,
  createdAt: new Date("2024-01-01"),
};

const mockDraftList: ListSummary = {
  id: "test-id-2",
  title: "Test Draft List",
  slug: "c3d4",
  description: null,
  isPublished: false,
  placeCount: 3,
  createdAt: new Date("2024-01-01"),
};

describe("ListCard", () => {
  describe("rendering", () => {
    it("renders list title", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);
      expect(screen.getByText("Test Published List")).toBeInTheDocument();
    });

    it("renders place count with correct pluralization", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);
      expect(screen.getByText("5 places")).toBeInTheDocument();
    });

    it("renders place count singular for one place", () => {
      const onClick = vi.fn();
      const singlePlaceList = { ...mockPublishedList, placeCount: 1 };
      render(<ListCard list={singlePlaceList} onClick={onClick} />);
      expect(screen.getByText("1 place")).toBeInTheDocument();
    });

    it("renders published badge for published lists", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);
      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it("renders draft badge for draft lists", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockDraftList} onClick={onClick} />);
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it("renders description when present", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);
      expect(
        screen.getByText("The best coffee spots in the city.")
      ).toBeInTheDocument();
    });

    it("renders nothing in description area when description is absent", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockDraftList} onClick={onClick} />);
      expect(
        screen.queryByText("The best coffee spots in the city.")
      ).not.toBeInTheDocument();
    });
  });

  describe("dropdown menu", () => {
    it("renders menu button", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);
      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      expect(menuButton).toBeInTheDocument();
    });

    it("opens menu when clicking menu button", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      expect(screen.getByText("Edit List")).toBeInTheDocument();
      expect(screen.getByText("Delete List")).toBeInTheDocument();
    });

    it("shows Unpublish for published lists", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      expect(screen.getByText("Unpublish")).toBeInTheDocument();
    });

    it("shows Publish for draft lists", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockDraftList} onClick={onClick} />);

      const menuButton = screen.getByLabelText("Options for Test Draft List");
      await user.click(menuButton);

      expect(screen.getByText("Publish")).toBeInTheDocument();
    });

    it("shows View Public Page only for published lists", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      expect(screen.getByText("View Public Page")).toBeInTheDocument();
    });

    it("does not show View Public Page for draft lists", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockDraftList} onClick={onClick} />);

      const menuButton = screen.getByLabelText("Options for Test Draft List");
      await user.click(menuButton);

      expect(screen.queryByText("View Public Page")).not.toBeInTheDocument();
    });

    it("shows Delete List with destructive styling", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const deleteItem = screen.getByText("Delete List");
      expect(deleteItem).toBeInTheDocument();
      expect(deleteItem).toHaveClass("text-destructive");
    });
  });

  describe("menu actions", () => {
    it("calls onEdit callback when Edit is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onEdit = vi.fn();

      render(
        <ListCard list={mockPublishedList} onClick={onClick} onEdit={onEdit} />
      );

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      await user.click(screen.getByText("Edit List"));

      expect(onEdit).toHaveBeenCalledWith("test-id-1");
    });

    it("calls onPublishToggle when Publish is clicked for draft", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onPublishToggle = vi.fn();

      render(
        <ListCard
          list={mockDraftList}
          onClick={onClick}
          onPublishToggle={onPublishToggle}
        />
      );

      const menuButton = screen.getByLabelText("Options for Test Draft List");
      await user.click(menuButton);

      await user.click(screen.getByText("Publish"));

      expect(onPublishToggle).toHaveBeenCalledWith("test-id-2");
    });

    it("calls onPublishToggle when Unpublish is clicked for published list", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onPublishToggle = vi.fn();

      render(
        <ListCard
          list={mockPublishedList}
          onClick={onClick}
          onPublishToggle={onPublishToggle}
        />
      );

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      await user.click(screen.getByText("Unpublish"));

      expect(onPublishToggle).toHaveBeenCalledWith("test-id-1");
    });

    it("shows AlertDialog confirmation when Delete is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onDelete = vi.fn();

      render(
        <ListCard
          list={mockPublishedList}
          onClick={onClick}
          onDelete={onDelete}
        />
      );

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      await user.click(screen.getByText("Delete List"));

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it("calls onDelete when Delete is confirmed in AlertDialog", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onDelete = vi.fn();

      render(
        <ListCard
          list={mockPublishedList}
          onClick={onClick}
          onDelete={onDelete}
        />
      );

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      await user.click(screen.getByText("Delete List"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      expect(onDelete).toHaveBeenCalledWith("test-id-1");
    });

    it("does not call onDelete when cancelled in AlertDialog", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onDelete = vi.fn();

      render(
        <ListCard
          list={mockPublishedList}
          onClick={onClick}
          onDelete={onDelete}
        />
      );

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      await user.click(screen.getByText("Delete List"));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it("logs to console when View Public Page is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const viewPublicButton = screen.getByText("View Public Page");
      await user.click(viewPublicButton);

      expect(consoleLog).toHaveBeenCalledWith("View public page:", "test-id-1");
      consoleLog.mockRestore();
    });

    it("does not trigger card click when menu is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not trigger card click when menu item is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onEdit = vi.fn();

      render(
        <ListCard list={mockPublishedList} onClick={onClick} onEdit={onEdit} />
      );

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const editButton = screen.getByText("Edit List");
      await user.click(editButton);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("card click", () => {
    it("calls onClick when card is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      // Click on the card title area to avoid menu button
      const title = screen.getByText("Test Published List");
      await user.click(title);

      expect(onClick).toHaveBeenCalledWith("test-id-1");
    });

    it("calls onClick when Enter key is pressed", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const card = screen.getByRole("button", { name: /View list/ });
      card.focus();
      await user.keyboard("{Enter}");

      expect(onClick).toHaveBeenCalledWith("test-id-1");
    });

    it("calls onClick when Space key is pressed", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const card = screen.getByRole("button", { name: /View list/ });
      card.focus();
      await user.keyboard(" ");

      expect(onClick).toHaveBeenCalledWith("test-id-1");
    });
  });
});
