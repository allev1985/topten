import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListCard } from "@/components/dashboard/ListCard";
import type { List } from "@/types/list";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...props} />,
}));

const mockPublishedList: List = {
  id: "test-id-1",
  title: "Test Published List",
  heroImageUrl: "https://example.com/image.jpg",
  isPublished: true,
  placeCount: 5,
};

const mockDraftList: List = {
  id: "test-id-2",
  title: "Test Draft List",
  heroImageUrl: "https://example.com/image.jpg",
  isPublished: false,
  placeCount: 3,
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

    it("renders hero image with correct alt text", () => {
      const onClick = vi.fn();
      render(<ListCard list={mockPublishedList} onClick={onClick} />);
      const img = screen.getByAltText("Test Published List cover image");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
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
      expect(screen.getByText("Duplicate List")).toBeInTheDocument();
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
    it("logs to console when Edit is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const editButton = screen.getByText("Edit List");
      await user.click(editButton);

      expect(consoleLog).toHaveBeenCalledWith("Edit list:", "test-id-1");
      consoleLog.mockRestore();
    });

    it("logs to console when Duplicate is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const duplicateButton = screen.getByText("Duplicate List");
      await user.click(duplicateButton);

      expect(consoleLog).toHaveBeenCalledWith("Duplicate list:", "test-id-1");
      consoleLog.mockRestore();
    });

    it("logs to console when Publish is clicked for draft", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockDraftList} onClick={onClick} />);

      const menuButton = screen.getByLabelText("Options for Test Draft List");
      await user.click(menuButton);

      const publishButton = screen.getByText("Publish");
      await user.click(publishButton);

      expect(consoleLog).toHaveBeenCalledWith("Publish list:", "test-id-2");
      consoleLog.mockRestore();
    });

    it("logs to console when Unpublish is clicked for published list", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const unpublishButton = screen.getByText("Unpublish");
      await user.click(unpublishButton);

      expect(consoleLog).toHaveBeenCalledWith("Unpublish list:", "test-id-1");
      consoleLog.mockRestore();
    });

    it("shows confirmation dialog when Delete is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const deleteButton = screen.getByText("Delete List");
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Published List"?'
      );

      confirmSpy.mockRestore();
    });

    it("logs to console when Delete is confirmed", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const deleteButton = screen.getByText("Delete List");
      await user.click(deleteButton);

      expect(consoleLog).toHaveBeenCalledWith("Delete list:", "test-id-1");

      confirmSpy.mockRestore();
      consoleLog.mockRestore();
    });

    it("does not log when Delete is cancelled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const deleteButton = screen.getByText("Delete List");
      await user.click(deleteButton);

      // Console should not be called with delete message when cancelled
      expect(consoleLog).not.toHaveBeenCalledWith("Delete list:", "test-id-1");

      confirmSpy.mockRestore();
      consoleLog.mockRestore();
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
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<ListCard list={mockPublishedList} onClick={onClick} />);

      const menuButton = screen.getByLabelText(
        "Options for Test Published List"
      );
      await user.click(menuButton);

      const editButton = screen.getByText("Edit List");
      await user.click(editButton);

      expect(onClick).not.toHaveBeenCalled();
      consoleLog.mockRestore();
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
