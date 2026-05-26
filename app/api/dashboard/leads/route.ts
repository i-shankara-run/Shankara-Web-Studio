import { requireAdminResponse } from "@/lib/auth";
import { query } from "@/lib/db";
import { type LeadRow } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauth = await requireAdminResponse();
  if (unauth) return unauth;
  const rows = await query<LeadRow>(`select * from leads order by created_at desc limit 200`);
  return Response.json({ leads: rows });
}
