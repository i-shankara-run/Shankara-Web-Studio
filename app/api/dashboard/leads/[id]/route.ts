import { NextRequest } from "next/server";
import { requireAdminResponse } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { leadUpdateSchema, type LeadRow } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdminResponse();
  if (unauth) return unauth;
  const { id } = await params;
  const lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [id]);
  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdminResponse();
  if (unauth) return unauth;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Validation failed" }, { status: 400 });

  const p = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  const push = (col: string, val: unknown) => {
    values.push(val);
    fields.push(`${col} = $${values.length}`);
  };
  if (p.status !== undefined) push("status", p.status);
  if (p.logoUrl !== undefined) push("logo_url", p.logoUrl || null);
  if (p.servicesNotes !== undefined) push("services_notes", p.servicesNotes);
  if (p.onlineUrls !== undefined) push("online_urls", p.onlineUrls);
  if (p.researchNotes !== undefined) push("research_notes", p.researchNotes);
  if (p.demoUrl !== undefined) push("demo_url", p.demoUrl || null);
  if (p.subdomain !== undefined) push("subdomain", p.subdomain || null);
  if (p.generatedPrompt !== undefined) push("generated_prompt", p.generatedPrompt);

  if (fields.length === 0) {
    const lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [id]);
    return Response.json({ lead });
  }
  values.push(id);
  const lead = await queryOne<LeadRow>(
    `update leads set ${fields.join(", ")} where id = $${values.length} returning *`,
    values,
  );
  return Response.json({ lead });
}
