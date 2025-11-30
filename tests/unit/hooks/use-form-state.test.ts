import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormState } from "@/hooks/use-form-state";
import type { ActionState } from "@/types/forms";

// Mock server action for testing
function createMockAction<T>(
  _response: ActionState<T>
): (prevState: ActionState<T>, formData: FormData) => Promise<ActionState<T>> {
  return vi.fn(async () => {
    return _response;
  });
}

describe("useFormState", () => {
  describe("initial state", () => {
    it("returns correct initial state values", () => {
      const mockAction = createMockAction<{ message: string }>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() => useFormState(mockAction));

      expect(result.current.state).toEqual({
        data: null,
        error: null,
        fieldErrors: {},
        isPending: false,
        isSuccess: false,
      });
    });

    it("uses provided initial state values", () => {
      const mockAction = createMockAction<{ message: string }>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() =>
        useFormState(mockAction, {
          error: "Initial error",
        })
      );

      expect(result.current.state.error).toBe("Initial error");
    });

    it("returns formAction function", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() => useFormState(mockAction));

      expect(typeof result.current.formAction).toBe("function");
    });

    it("returns reset function", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() => useFormState(mockAction));

      expect(typeof result.current.reset).toBe("function");
    });

    it("includes isPending in state", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() => useFormState(mockAction));

      expect(result.current.state.isPending).toBe(false);
    });
  });

  describe("form action invocation", () => {
    it("formAction is a function that can be called", () => {
      const mockAction = createMockAction<{ message: string }>({
        data: { message: "Success" },
        error: null,
        fieldErrors: {},
        isSuccess: true,
      });

      const { result } = renderHook(() => useFormState(mockAction));

      // Verify formAction exists and is callable
      expect(result.current.formAction).toBeDefined();
      expect(typeof result.current.formAction).toBe("function");
    });
  });

  describe("reset functionality", () => {
    it("reset function can be called without throwing", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() => useFormState(mockAction));

      // Should not throw
      expect(() => {
        act(() => {
          result.current.reset();
        });
      }).not.toThrow();
    });

    it("reset function is stable across renders", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result, rerender } = renderHook(() => useFormState(mockAction));

      const resetFn = result.current.reset;
      rerender();

      expect(result.current.reset).toBe(resetFn);
    });
  });

  describe("initial state variations", () => {
    it("can provide initial data value", () => {
      interface TestData {
        message: string;
      }

      const mockAction = createMockAction<TestData>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() =>
        useFormState(mockAction, {
          data: { message: "Initial message" },
        })
      );

      expect(result.current.state.data?.message).toBe("Initial message");
    });

    it("can provide initial fieldErrors", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() =>
        useFormState(mockAction, {
          fieldErrors: { email: ["Please enter email"] },
        })
      );

      expect(result.current.state.fieldErrors.email).toEqual([
        "Please enter email",
      ]);
    });

    it("can provide initial isSuccess value", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() =>
        useFormState(mockAction, {
          isSuccess: true,
        })
      );

      expect(result.current.state.isSuccess).toBe(true);
    });
  });

  describe("type safety", () => {
    it("correctly types the state data property", () => {
      interface LoginData {
        redirectTo: string;
      }

      const mockAction = createMockAction<LoginData>({
        data: { redirectTo: "/dashboard" },
        error: null,
        fieldErrors: {},
        isSuccess: true,
      });

      const { result } = renderHook(() =>
        useFormState(mockAction, {
          data: { redirectTo: "/initial" },
        })
      );

      // TypeScript should allow accessing redirectTo
      expect(result.current.state.data?.redirectTo).toBe("/initial");
    });

    it("state includes all FormState properties", () => {
      const mockAction = createMockAction<unknown>({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });

      const { result } = renderHook(() => useFormState(mockAction));

      // Verify all FormState properties exist
      expect("data" in result.current.state).toBe(true);
      expect("error" in result.current.state).toBe(true);
      expect("fieldErrors" in result.current.state).toBe(true);
      expect("isPending" in result.current.state).toBe(true);
      expect("isSuccess" in result.current.state).toBe(true);
    });
  });
});
