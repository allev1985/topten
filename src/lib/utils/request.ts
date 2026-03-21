import { headers } from "next/headers";

/**
 * Extract the client IP address from request headers.
 * Checks `x-forwarded-for` (first entry) then `x-real-ip`.
 * Falls back to `"unknown"` when neither header is present.
 * @returns The client IP address string
 */
export async function getClientIP(): Promise<string> {
  const h = await headers();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
