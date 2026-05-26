import { NextRequest } from "next/server";
import { z } from "zod";
import { checkPassword, issueSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = z.object({ password: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Password required" }, { status: 400 });
  }
  if (!checkPassword(parsed.data.password)) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }
  await issueSessionCookie();
  return Response.json({ ok: true });
}
