import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Optimistic gate in front of every route: no valid session cookie means
 * pages redirect to /login and everything else (server actions, photos) gets 401.
 * Pages, actions and the photo route also check the session themselves.
 */
export function proxy(request: NextRequest) {
  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const isPage = request.method === "GET" && !request.headers.has("next-action") && !request.nextUrl.pathname.startsWith("/photos/");
  if (!isPage) return new NextResponse("Unauthorized", { status: 401 });

  const url = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = "/login";
  url.search = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the login page, Next.js assets, and the public app icon/manifest.
  matcher: ["/((?!login|_next/static|_next/image|icon\\.svg|manifest\\.webmanifest|favicon\\.ico).*)"],
};
