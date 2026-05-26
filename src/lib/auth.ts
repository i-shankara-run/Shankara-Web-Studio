import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set (>=32 chars)");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function checkPassword(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueSessionCookie(): void {
  const issued = Date.now();
  const expires = issued + SESSION_TTL_MS;
  const payload = `${issued}.${expires}`;
  const value = `${payload}.${sign(payload)}`;
  setCookie(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(): void {
  setCookie(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export function isAuthenticated(): boolean {
  const raw = getCookie(SESSION_COOKIE);
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [issued, expires, sig] = parts;
  const expected = sign(`${issued}.${expires}`);
  if (sig !== expected) return false;
  const exp = Number(expires);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  status = 401;
  constructor() {
    super("Unauthorized");
  }
}

export function requireAdmin(): void {
  if (!isAuthenticated()) throw new UnauthorizedError();
}
