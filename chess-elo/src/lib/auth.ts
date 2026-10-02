import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE, verifySessionToken } from "./session";

export async function isSignedIn() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Data-layer check, so nothing is served even if the proxy is bypassed. */
export async function requireSession() {
  if (!(await isSignedIn())) redirect("/login");
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in.");
  }
}

/** For server actions: throw instead of redirecting so callers get a clear error. */
export async function assertSession() {
  if (!(await isSignedIn())) throw new UnauthorizedError();
}

async function isHttps() {
  const h = await headers();
  return h.get("x-forwarded-proto")?.split(",")[0].trim() === "https" || (h.get("origin") ?? "").startsWith("https:");
}

export async function startSession() {
  const session = createSessionToken();
  if (!session) throw new Error("APP_PASSWORD is not set.");
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    // Plain-HTTP setups (e.g. a Raspberry Pi on the home network) can't store Secure cookies.
    secure: await isHttps(),
    path: "/",
    expires: session.expires,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// Simple in-memory throttle against password guessing.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const failures = new Map<string, { count: number; since: number }>();

export async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export function isThrottled(key: string, now = Date.now()) {
  const f = failures.get(key);
  if (!f || now - f.since > WINDOW_MS) return false;
  return f.count >= MAX_FAILURES;
}

export function recordFailure(key: string, now = Date.now()) {
  const f = failures.get(key);
  if (!f || now - f.since > WINDOW_MS) failures.set(key, { count: 1, since: now });
  else f.count += 1;
}

export function clearFailures(key: string) {
  failures.delete(key);
}
