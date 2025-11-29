import { NextResponse } from "next/server";
import type { AuthError, AuthErrorResponse } from "@/lib/auth/errors";

/**
 * Standard success response format for API endpoints
 * Data fields are spread at the top level alongside success flag
 */
export type ApiSuccessResponse<T = Record<string, unknown>> = {
  success: true;
} & T;

/**
 * Creates a JSON response from an AuthError
 * Extracts status from the error's httpStatus property
 */
export function errorResponse(
  error: AuthError
): NextResponse<AuthErrorResponse> {
  return NextResponse.json(error.toResponse(), { status: error.httpStatus });
}

/**
 * Creates a success JSON response with optional data
 * Data fields are spread at the top level alongside the success flag
 */
export function successResponse<T extends Record<string, unknown>>(
  data?: T,
  status: number = 200
): NextResponse<{ success: true } & T> {
  const response = {
    success: true as const,
    ...data,
  };
  return NextResponse.json(response as { success: true } & T, { status });
}

/**
 * Creates a redirect response to the specified URL
 * Handles URL construction by combining origin with path
 */
export function redirectResponse(
  origin: string,
  path: string,
  queryParams?: Record<string, string>
): NextResponse {
  let url = `${origin}${path}`;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams);
    url = `${url}?${params.toString()}`;
  }
  return NextResponse.redirect(url);
}
