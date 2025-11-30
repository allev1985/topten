import { describe, it, expect } from "vitest";
import {
  initialFormState,
  initialActionState,
  mapFieldErrors,
  type FormState,
  type ActionState,
  type FieldError,
} from "@/types/forms";

describe("Form Types", () => {
  describe("initialFormState", () => {
    it("returns correct initial state", () => {
      const state = initialFormState();

      expect(state).toEqual({
        data: null,
        error: null,
        fieldErrors: {},
        isPending: false,
        isSuccess: false,
      });
    });

    it("returns a new object each time", () => {
      const state1 = initialFormState();
      const state2 = initialFormState();

      expect(state1).not.toBe(state2);
    });

    it("works with generic type parameter", () => {
      interface TestData {
        message: string;
      }

      const state: FormState<TestData> = initialFormState<TestData>();

      expect(state.data).toBeNull();
      expect(state.error).toBeNull();
      expect(state.fieldErrors).toEqual({});
      expect(state.isPending).toBe(false);
      expect(state.isSuccess).toBe(false);
    });
  });

  describe("initialActionState", () => {
    it("returns correct initial state without isPending", () => {
      const state = initialActionState();

      expect(state).toEqual({
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      });
      expect("isPending" in state).toBe(false);
    });

    it("returns a new object each time", () => {
      const state1 = initialActionState();
      const state2 = initialActionState();

      expect(state1).not.toBe(state2);
    });

    it("works with generic type parameter", () => {
      interface TestData {
        redirectTo: string;
      }

      const state: ActionState<TestData> = initialActionState<TestData>();

      expect(state.data).toBeNull();
      expect(state.error).toBeNull();
      expect(state.fieldErrors).toEqual({});
      expect(state.isSuccess).toBe(false);
    });
  });

  describe("mapFieldErrors", () => {
    it("maps single field error", () => {
      const details: FieldError[] = [
        { field: "email", message: "Invalid email format" },
      ];

      const result = mapFieldErrors(details);

      expect(result).toEqual({
        email: ["Invalid email format"],
      });
    });

    it("maps multiple errors for same field", () => {
      const details: FieldError[] = [
        {
          field: "password",
          message: "Password must be at least 12 characters",
        },
        {
          field: "password",
          message: "Password must contain an uppercase letter",
        },
      ];

      const result = mapFieldErrors(details);

      expect(result).toEqual({
        password: [
          "Password must be at least 12 characters",
          "Password must contain an uppercase letter",
        ],
      });
    });

    it("maps multiple fields with errors", () => {
      const details: FieldError[] = [
        { field: "email", message: "Invalid email format" },
        { field: "password", message: "Password is required" },
        { field: "email", message: "Email is already taken" },
      ];

      const result = mapFieldErrors(details);

      expect(result).toEqual({
        email: ["Invalid email format", "Email is already taken"],
        password: ["Password is required"],
      });
    });

    it("returns empty object for empty array", () => {
      const result = mapFieldErrors([]);

      expect(result).toEqual({});
    });

    it("preserves order of errors for each field", () => {
      const details: FieldError[] = [
        { field: "password", message: "First error" },
        { field: "password", message: "Second error" },
        { field: "password", message: "Third error" },
      ];

      const result = mapFieldErrors(details);

      expect(result.password).toEqual([
        "First error",
        "Second error",
        "Third error",
      ]);
    });
  });

  describe("FormState type", () => {
    it("can be used with specific data type", () => {
      interface LoginData {
        redirectTo: string;
      }

      const successState: FormState<LoginData> = {
        data: { redirectTo: "/dashboard" },
        error: null,
        fieldErrors: {},
        isPending: false,
        isSuccess: true,
      };

      expect(successState.data?.redirectTo).toBe("/dashboard");
    });

    it("can represent error state", () => {
      const errorState: FormState<unknown> = {
        data: null,
        error: "Invalid credentials",
        fieldErrors: {},
        isPending: false,
        isSuccess: false,
      };

      expect(errorState.error).toBe("Invalid credentials");
      expect(errorState.isSuccess).toBe(false);
    });

    it("can represent pending state", () => {
      const pendingState: FormState<unknown> = {
        data: null,
        error: null,
        fieldErrors: {},
        isPending: true,
        isSuccess: false,
      };

      expect(pendingState.isPending).toBe(true);
    });

    it("can represent field validation errors", () => {
      const validationErrorState: FormState<unknown> = {
        data: null,
        error: null,
        fieldErrors: {
          email: ["Invalid email format"],
          password: ["Password is required"],
        },
        isPending: false,
        isSuccess: false,
      };

      expect(validationErrorState.fieldErrors.email).toContain(
        "Invalid email format"
      );
      expect(validationErrorState.fieldErrors.password).toContain(
        "Password is required"
      );
    });
  });

  describe("ActionState type", () => {
    it("does not include isPending property", () => {
      const state: ActionState<unknown> = {
        data: null,
        error: null,
        fieldErrors: {},
        isSuccess: false,
      };

      // TypeScript should not allow isPending on ActionState
      expect("isPending" in state).toBe(false);
    });

    it("can be used for server action return type", () => {
      interface SignupResult {
        message: string;
        redirectTo: string;
      }

      const successResult: ActionState<SignupResult> = {
        data: {
          message: "Please check your email",
          redirectTo: "/verify-email",
        },
        error: null,
        fieldErrors: {},
        isSuccess: true,
      };

      expect(successResult.data?.message).toBe("Please check your email");
      expect(successResult.data?.redirectTo).toBe("/verify-email");
    });
  });
});
