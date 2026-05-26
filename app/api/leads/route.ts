import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { leadCreateSchema, type LeadRow } from "@/lib/schemas";
import { sendTemplate } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 10;

async function rateLimitOk(ip: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const row = await queryOne<{ count: number }>(
    `insert into rate_limits (ip, count, window_start)
     values ($1, 1, now())
     on conflict (ip) do update set
       count = case when rate_limits.window_start < $2 then 1 else rate_limits.count + 1 end,
       window_start = case when rate_limits.window_start < $2 then now() else rate_limits.window_start end
     returning count`,
    [ip, cutoff],
  );
  return (row?.count ?? 0) <= RATE_MAX;
}

export async function POST(req: NextRequest) {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadCreateSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const ok = await rateLimitOk(ip).catch(() => true);
  if (!ok) {
    return Response.json(
      { error: "Too many requests — please try again in an hour." },
      { status: 429 },
    );
  }

  const d = parsed.data;
  const rows = await query<LeadRow>(
    `insert into leads
       (business_name, business_desc, whatsapp_e164, brand_color, brand_shade,
        packages, search_context, generated_prompt, status)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7::text, $8::text,
             case when $8::text is not null then 'prompt_generated'::lead_status else 'new'::lead_status end)
     returning *`,
    [
      d.businessName,
      d.businessDescription,
      d.whatsappE164,
      d.brandColor,
      d.brandShade,
      JSON.stringify(d.packages),
      d.searchContext ?? null,
      d.dashboardPrompt ?? null,
    ],
  );
  const lead = rows[0];
  if (!lead) return Response.json({ error: "Insert failed" }, { status: 500 });

  // Fire-and-forget WhatsApp
  sendTemplate(d.whatsappE164, d.businessName)
    .then(async (r) => {
      if (r.messageId) {
        await query(`update leads set wa_msg_id = $1 where id = $2`, [r.messageId, lead.id]);
      } else if (r.error) {
        await query(`update leads set wa_error = $1 where id = $2`, [r.error, lead.id]);
      }
    })
    .catch(async (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      await query(`update leads set wa_error = $1 where id = $2`, [msg, lead.id]).catch(() => {});
    });

  return Response.json({ id: lead.id }, { status: 201 });
}

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}
