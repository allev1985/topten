import { NextResponse } from "next/server";
import type { AuthError, AuthErrorResponse } from "@/lib/auth/errors";

/**
 * Standard success response format for API endpoints
 */
export interface ApiSuccessResponse<T = Record<string, unknown>> {
  success: true;
  data?: T;
  message?: string;
  redirectTo?: string;
}

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
 */
export function successResponse<T = Record<string, unknown>>(
  data?: T & { message?: string; redirectTo?: string },
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    ...data,
  };
  return NextResponse.json(response, { status });
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
