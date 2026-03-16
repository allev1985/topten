import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePlaceForm } from "@/components/dashboard/places/CreatePlaceForm";
import * as placeActions from "@/actions/place-actions";
import type { SearchPlacesSuccessData } from "@/actions/place-actions";
import type { GooglePlaceResult } from "@/lib/services/google-places/types";
import type { ActionState } from "@/types/forms";

// ─── Mock server actions ──────────────────────────────────────────────────────

vi.mock("@/actions/place-actions", () => ({
  searchPlacesAction: vi.fn(),
  resolveGooglePlacePhotoAction: vi.fn(),
  createPlaceAction: vi.fn(),
}));

// ─── Control useActionState via React mock ────────────────────────────────────

const mockFormAction = vi.fn();
let mockState = { data: null, error: null, fieldErrors: {}, isSuccess: false };
let mockIsPending = false;

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useActionState: (_action: unknown, _initial: unknown) => [
      mockState,
      mockFormAction,
      mockIsPending,
    ],
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PLACE_WITH_PHOTO = {
  googlePlaceId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
  name: "Nobu",
  formattedAddress: "19 Old Park Lane, London W1K 1LB, UK",
  latitude: 51.5074,
  longitude: -0.1488,
  photoResourceName: "places/ChIJdd4hrwug2EcRmSrV3Vo6llI/photos/AbcDef123",
};

const PLACE_NO_PHOTO = {
  googlePlaceId: "ChIJXXXX",
  name: "Nobu Hotel",
  formattedAddress: "6 Upper St Martin's Lane, London WC2H 9NY, UK",
  latitude: 51.5126,
  longitude: -0.1275,
  photoResourceName: null,
};

function successSearch(
  places: GooglePlaceResult[] = [PLACE_WITH_PHOTO]
): ActionState<SearchPlacesSuccessData> {
  return {
    data: { results: places },
    error: null,
    fieldErrors: {},
    isSuccess: true,
  };
}

function failSearch(error: string): ActionState<SearchPlacesSuccessData> {
  return { data: null, error, fieldErrors: {}, isSuccess: false };
}

function renderForm(props?: Partial<Parameters<typeof CreatePlaceForm>[0]>) {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  render(
    <CreatePlaceForm onSuccess={onSuccess} onCancel={onCancel} {...props} />
  );
  return { onSuccess, onCancel };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CreatePlaceForm", () => {
  const mockSearch = vi.mocked(placeActions.searchPlacesAction);
  const mockResolvePhoto = vi.mocked(
    placeActions.resolveGooglePlacePhotoAction
  );

  beforeEach(() => {
    mockState = { data: null, error: null, fieldErrors: {}, isSuccess: false };
    mockIsPending = false;
    mockSearch.mockResolvedValue(successSearch());
    mockResolvePhoto.mockResolvedValue({
      data: { photoUri: "https://example.com/photo.jpg" },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    });
  });

  afterEach(() => vi.clearAllMocks());

  // ── Initial render ──────────────────────────────────────────────────────────

  it("renders the search input", () => {
    renderForm();
    expect(screen.getByLabelText(/search for a place/i)).toBeTruthy();
  });

  it("submit button is disabled initially", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /add place/i })).toBeDisabled();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  // ── Debounce ───────────────────────────────────────────────────────────────

  it("does not call searchPlacesAction for fewer than 3 chars", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/search for a place/i), "No");
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("calls searchPlacesAction after 300 ms debounce for ≥3 chars", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/search for a place/i), "Nob");
    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith("Nob"));
  }, 3000);

  it("shows suggestion dropdown after a successful search", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/search for a place/i), "Nobu");
    await waitFor(() =>
      expect(
        screen.getByRole("listbox", { name: /place suggestions/i })
      ).toBeTruthy()
    );
  }, 3000);

  // ── Error states ───────────────────────────────────────────────────────────

  it("shows API configuration error message", async () => {
    mockSearch.mockResolvedValue(
      failSearch("Place search is not configured — contact support.")
    );
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/search for a place/i), "Nobu");
    await waitFor(() =>
      expect(screen.getByText(/place search is not configured/i)).toBeTruthy()
    );
  }, 3000);

  it("falls back to 'Search failed.' when action returns no error string", async () => {
    mockSearch.mockResolvedValue({
      data: null,
      error: null,
      fieldErrors: {},
      isSuccess: false,
    });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/search for a place/i), "Nobu");
    await waitFor(() =>
      expect(screen.getByText(/search failed/i)).toBeTruthy()
    );
  }, 3000);

  // ── Place selection ────────────────────────────────────────────────────────

  it("enables submit after selecting a place with no photo", async () => {
    mockSearch.mockResolvedValue(successSearch([PLACE_NO_PHOTO]));
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/search for a place/i), "Nobu");
    await waitFor(() =>
      expect(
        screen.getByRole("listbox", { name: /place suggestions/i })
      ).toBeTruthy()
    );
    const listbox = screen.getByRole("listbox", { name: /place suggestions/i });
    await user.click(within(listbox).getAllByRole("button")[0]!);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /add place/i })
      ).not.toBeDisabled()
    );
  }, 3000);

  it("calls resolveGooglePlacePhotoAction when a place with a photo is selected", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/search for a place/i), "Nobu");
    await waitFor(() =>
      expect(
        screen.getByRole("listbox", { name: /place suggestions/i })
      ).toBeTruthy()
    );
    const listbox = screen.getByRole("listbox", { name: /place suggestions/i });
    await user.click(within(listbox).getAllByRole("button")[0]!);
    await waitFor(() =>
      expect(mockResolvePhoto).toHaveBeenCalledWith(
        "places/ChIJdd4hrwug2EcRmSrV3Vo6llI/photos/AbcDef123"
      )
    );
  }, 3000);
});
