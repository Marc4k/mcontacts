import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "checkmate_session";
export const SESSION_DAYS = 90;

/**
 * Signing key. Defaults to one derived from the password, so changing
 * APP_PASSWORD signs everyone out. Set AUTH_SECRET to decouple the two.
 */
function key(): string | null {
  const password = process.env.APP_PASSWORD;
  if (!password) return null;
  return process.env.AUTH_SECRET || `pw:${password}`;
}

export function isConfigured() {
  return Boolean(process.env.APP_PASSWORD);
}

function sign(payload: string, k: string) {
  return createHmac("sha256", k).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Token format: `v1.<expiresAtMs>.<hmac>`. */
export function createSessionToken(now = Date.now()): { token: string; expires: Date } | null {
  const k = key();
  if (!k) return null;
  const exp = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `v1.${exp}`;
  return { token: `${payload}.${sign(payload, k)}`, expires: new Date(exp) };
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  const k = key();
  if (!k || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= now) return false;
  return safeEqual(parts[2], sign(`v1.${parts[1]}`, k));
}

export function checkPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD;
  if (!password) return false;
  // Compare fixed-length digests so the check doesn't leak the password length.
  const digest = (s: string) => createHmac("sha256", "checkmate-password").update(s).digest("base64url");
  return safeEqual(digest(input), digest(password));
}
