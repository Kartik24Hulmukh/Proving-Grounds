import { rateLimitMiddleware } from "@/lib/middleware/rate-limit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware — P7.3
 * Applies rate limiting to public + intake routes.
 */
export async function middleware(request: NextRequest) {
  const limited = await rateLimitMiddleware(request);
  if (limited) {
    return limited;
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/health",
    "/api/intake",
    "/leaderboard",
    "/methodology",
    "/submit",
  ],
};
