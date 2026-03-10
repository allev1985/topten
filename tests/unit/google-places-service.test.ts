import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchPlaces, resolvePhotoUri } from "@/lib/services/google-places/service";
import { GooglePlacesServiceError } from "@/lib/services/google-places/errors";

vi.mock("@/lib/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/config")>()),
  GOOGLE_PLACES_CONFIG: { apiKey: "test-api-key-12345" },
}));

import * as config from "@/lib/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetch(response: {
  ok: boolean;
  status?: number;
  statusText?: string;
  body: unknown;
}) {
  const mockResponse = {
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    statusText: response.statusText ?? (response.ok ? "OK" : "Internal Server Error"),
    json: vi.fn().mockResolvedValue(response.body),
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));
  return mockResponse;
}

function mockFetchThrow(err: Error) {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(err));
}

const VALID_TEXT_SEARCH_RESPONSE = {
  places: [
    {
      id: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
      displayName: { text: "Nobu" },
      formattedAddress: "19 Old Park Lane, London W1K 1LB, UK",
      location: { latitude: 51.5074, longitude: -0.1488 },
      photos: [{ name: "places/ChIJdd4hrwug2EcRmSrV3Vo6llI/photos/AbcDef123" }],
    },
    {
      id: "ChIJXXXX",
      displayName: { text: "Nobu Hotel" },
      formattedAddress: "6 Upper St Martin's Lane, London WC2H 9NY, UK",
      location: { latitude: 51.5126, longitude: -0.1275 },
      // no photos
    },
  ],
};

// ─── Environment setup ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(config).GOOGLE_PLACES_CONFIG = { apiKey: "test-api-key-12345" };
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ─── searchPlaces ─────────────────────────────────────────────────────────────

describe("searchPlaces", () => {
  describe("INVALID_QUERY", () => {
    it("throws INVALID_QUERY when query is empty string", async () => {
      await expect(searchPlaces("")).rejects.toMatchObject({
        code: "INVALID_QUERY",
      });
    });

    it("throws INVALID_QUERY when query has fewer than 3 chars", async () => {
      await expect(searchPlaces("No")).rejects.toMatchObject({
        code: "INVALID_QUERY",
      });
    });

    it("throws INVALID_QUERY when query is only whitespace (< 3 chars trimmed)", async () => {
      await expect(searchPlaces("  ")).rejects.toMatchObject({
        code: "INVALID_QUERY",
      });
    });

    it("does NOT make an HTTP request when query is too short", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      await expect(searchPlaces("ab")).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("CONFIGURATION_ERROR", () => {
    it("throws CONFIGURATION_ERROR when API key env var is missing", async () => {
      vi.mocked(config).GOOGLE_PLACES_CONFIG = { apiKey: "" };
      await expect(searchPlaces("Nobu")).rejects.toMatchObject({
        code: "CONFIGURATION_ERROR",
      });
    });

    it("is a GooglePlacesServiceError instance", async () => {
      vi.mocked(config).GOOGLE_PLACES_CONFIG = { apiKey: "" };
      await expect(searchPlaces("Nobu")).rejects.toBeInstanceOf(
        GooglePlacesServiceError
      );
    });
  });

  describe("successful response mapping", () => {
    it("returns a GooglePlaceResult[] on success", async () => {
      mockFetch({ ok: true, body: VALID_TEXT_SEARCH_RESPONSE });
      const results = await searchPlaces("Nobu");
      expect(results).toHaveLength(2);
    });

    it("maps googlePlaceId from places[n].id", async () => {
      mockFetch({ ok: true, body: VALID_TEXT_SEARCH_RESPONSE });
      const [first] = await searchPlaces("Nobu");
      expect(first?.googlePlaceId).toBe("ChIJdd4hrwug2EcRmSrV3Vo6llI");
    });

    it("maps name from displayName.text", async () => {
      mockFetch({ ok: true, body: VALID_TEXT_SEARCH_RESPONSE });
      const [first] = await searchPlaces("Nobu");
      expect(first?.name).toBe("Nobu");
    });

    it("maps formattedAddress", async () => {
      mockFetch({ ok: true, body: VALID_TEXT_SEARCH_RESPONSE });
      const [first] = await searchPlaces("Nobu");
      expect(first?.formattedAddress).toBe("19 Old Park Lane, London W1K 1LB, UK");
    });

    it("maps latitude and longitude from location", async () => {
      mockFetch({ ok: true, body: VALID_TEXT_SEARCH_RESPONSE });
      const [first] = await searchPlaces("Nobu");
      expect(first?.latitude).toBe(51.5074);
      expect(first?.longitude).toBe(-0.1488);
    });

    it("maps photoResourceName from photos[0].name", async () => {
      mockFetch({ ok: true, body: VALID_TEXT_SEARCH_RESPONSE });
      const [first] = await searchPlaces("Nobu");
      expect(first?.photoResourceName).toBe(
        "places/ChIJdd4hrwug2EcRmSrV3Vo6llI/photos/AbcDef123"
      );
    });

    it("sets photoResourceName to null when photos array is absent", async () => {
      mockFetch({ ok: true, body: VALID_TEXT_SEARCH_RESPONSE });
      const results = await searchPlaces("Nobu");
      expect(results[1]?.photoResourceName).toBeNull();
    });

    it("returns empty array when Google returns no places", async () => {
      mockFetch({ ok: true, body: { places: [] } });
      const results = await searchPlaces("Nobu");
      expect(results).toHaveLength(0);
    });

    it("returns empty array when places key is absent from response", async () => {
      mockFetch({ ok: true, body: {} });
      const results = await searchPlaces("Nobu");
      expect(results).toHaveLength(0);
    });
  });

  describe("API_ERROR", () => {
    it("throws API_ERROR when response status is non-200", async () => {
      mockFetch({ ok: false, status: 500, body: {} });
      await expect(searchPlaces("Nobu")).rejects.toMatchObject({
        code: "API_ERROR",
      });
    });

    it("throws API_ERROR when response body contains an error object", async () => {
      mockFetch({
        ok: false,
        status: 400,
        body: { error: { code: 400, message: "INVALID_ARGUMENT" } },
      });
      await expect(searchPlaces("Nobu")).rejects.toMatchObject({
        code: "API_ERROR",
      });
    });

    it("throws API_ERROR when JSON parsing fails", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));
      await expect(searchPlaces("Nobu")).rejects.toMatchObject({
        code: "API_ERROR",
      });
    });
  });

  describe("TIMEOUT", () => {
    it("throws TIMEOUT when fetch throws a TimeoutError (DOMException)", async () => {
      const timeoutErr = new DOMException("The operation timed out.", "TimeoutError");
      mockFetchThrow(timeoutErr);
      await expect(searchPlaces("Nobu")).rejects.toMatchObject({
        code: "TIMEOUT",
      });
    });

    it("throws TIMEOUT when fetch throws an AbortError", async () => {
      const abortErr = new DOMException("Aborted", "AbortError");
      mockFetchThrow(abortErr);
      await expect(searchPlaces("Nobu")).rejects.toMatchObject({
        code: "TIMEOUT",
      });
    });
  });

  it("sends correct fields in request body", async () => {
    mockFetch({ ok: true, body: { places: [] } });
    await searchPlaces("Nobu restaurant");
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [url, options] = fetchCall as [string, RequestInit];
    expect(url).toBe("https://places.googleapis.com/v1/places:searchText");
    const body = JSON.parse(options.body as string) as { textQuery: string; pageSize: number };
    expect(body.textQuery).toBe("Nobu restaurant");
    expect(body.pageSize).toBe(5);
  });

  it("sends X-Goog-FieldMask header with all required fields", async () => {
    mockFetch({ ok: true, body: { places: [] } });
    await searchPlaces("Nobu");
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [, options] = fetchCall as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["X-Goog-FieldMask"]).toContain("places.id");
    expect(headers["X-Goog-FieldMask"]).toContain("places.displayName");
    expect(headers["X-Goog-FieldMask"]).not.toContain("places.editorialSummary");
    expect(headers["X-Goog-FieldMask"]).toContain("places.photos");
  });
});

// ─── resolvePhotoUri ──────────────────────────────────────────────────────────

describe("resolvePhotoUri", () => {
  const PHOTO_RESOURCE_NAME = "places/ChIJdd4hrwug2EcRmSrV3Vo6llI/photos/AbcDef123";
  const RESOLVED_URI = "https://lh3.googleusercontent.com/places/photo/abc123";

  describe("INVALID_QUERY", () => {
    it("throws INVALID_QUERY when photoResourceName is empty", async () => {
      await expect(resolvePhotoUri("")).rejects.toMatchObject({
        code: "INVALID_QUERY",
      });
    });

    it("does NOT make an HTTP request when name is empty", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      await expect(resolvePhotoUri("")).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("CONFIGURATION_ERROR", () => {
    it("throws CONFIGURATION_ERROR when API key is missing", async () => {
      vi.mocked(config).GOOGLE_PLACES_CONFIG = { apiKey: "" };
      await expect(resolvePhotoUri(PHOTO_RESOURCE_NAME)).rejects.toMatchObject({
        code: "CONFIGURATION_ERROR",
      });
    });
  });

  describe("successful resolution", () => {
    it("returns the photoUri string on success", async () => {
      mockFetch({ ok: true, body: { photoUri: RESOLVED_URI } });
      const result = await resolvePhotoUri(PHOTO_RESOURCE_NAME);
      expect(result).toBe(RESOLVED_URI);
    });

    it("calls the correct endpoint URL containing the resource name", async () => {
      mockFetch({ ok: true, body: { photoUri: RESOLVED_URI } });
      await resolvePhotoUri(PHOTO_RESOURCE_NAME);
      const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const [url] = fetchCall as [string];
      expect(url).toContain(PHOTO_RESOURCE_NAME);
      expect(url).toContain("maxWidthPx=800");
      expect(url).toContain("skipHttpRedirect=true");
    });
  });

  describe("API_ERROR", () => {
    it("throws API_ERROR on non-200 response", async () => {
      mockFetch({ ok: false, status: 404, body: { error: { code: 404, message: "Not Found" } } });
      await expect(resolvePhotoUri(PHOTO_RESOURCE_NAME)).rejects.toMatchObject({
        code: "API_ERROR",
      });
    });

    it("throws API_ERROR when photoUri is absent from response", async () => {
      mockFetch({ ok: true, body: {} });
      await expect(resolvePhotoUri(PHOTO_RESOURCE_NAME)).rejects.toMatchObject({
        code: "API_ERROR",
      });
    });
  });

  describe("TIMEOUT", () => {
    it("throws TIMEOUT when fetch throws a TimeoutError", async () => {
      const timeoutErr = new DOMException("Timed out", "TimeoutError");
      mockFetchThrow(timeoutErr);
      await expect(resolvePhotoUri(PHOTO_RESOURCE_NAME)).rejects.toMatchObject({
        code: "TIMEOUT",
      });
    });
  });
});
