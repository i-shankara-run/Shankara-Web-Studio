import { NextRequest, NextResponse } from "next/server";

// Edge-runtime safe HMAC using Web Crypto API.
// Auth cookie format: `${issued}.${expires}.${hex(hmacSha256(`${issued}.${expires}`))}`

const SESSION_COOKIE = "admin_session";

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isAuthed(cookieValue: string | undefined, secret: string): Promise<boolean> {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [issued, expires, sig] = parts;
  try {
    if (sig !== (await hmacHex(secret, `${issued}.${expires}`))) return false;
  } catch {
    return false;
  }
  const exp = Number(expires);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();
  if (pathname === "/dashboard/login") return NextResponse.next();

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/login";
    url.searchParams.set("err", "config");
    return NextResponse.redirect(url);
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (await isAuthed(cookie, secret)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/dashboard/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
