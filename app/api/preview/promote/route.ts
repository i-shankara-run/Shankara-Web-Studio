import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { previewPromoteSchema, type LeadRow } from "@/lib/schemas";
import { sendTemplate } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = previewPromoteSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { leadId, whatsappE164 } = parsed.data;

  let lead: LeadRow | null = null;
  try {
    lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [leadId]);
  } catch (e) {
    console.warn("preview/promote lookup failed (DB unreachable):", e);
    // Graceful: report saved=false so client shows a friendly note instead of crashing
    return Response.json(
      {
        ok: true,
        saved: false,
        warning:
          "We received your WhatsApp but couldn't persist it right now. Please try again in a moment, or message hello@shankara.in directly.",
      },
      { status: 200 },
    );
  }

  if (!lead) {
    return Response.json(
      { error: "We couldn't find that preview session. Please run the generator once more." },
      { status: 404 },
    );
  }

  if (lead.status !== "preview") {
    return Response.json({ error: "Already promoted" }, { status: 409 });
  }

  let updated: LeadRow | null = null;
  try {
    updated = await queryOne<LeadRow>(
      `update leads set whatsapp_e164 = $1, status = 'new'::lead_status
       where id = $2 and status = 'preview'::lead_status
       returning *`,
      [whatsappE164, leadId],
    );
  } catch (e) {
    console.warn("preview/promote update failed:", e);
    return Response.json(
      { error: "Couldn't save your details right now. Please try again." },
      { status: 503 },
    );
  }
  if (!updated) {
    return Response.json({ error: "Promote failed" }, { status: 500 });
  }

  // Fire-and-forget WhatsApp template
  sendTemplate(whatsappE164, updated.business_name)
    .then(async (r) => {
      if (r.messageId) {
        await query(`update leads set wa_msg_id = $1 where id = $2`, [r.messageId, leadId]).catch(() => {});
      } else if (r.error) {
        await query(`update leads set wa_error = $1 where id = $2`, [r.error, leadId]).catch(() => {});
      }
    })
    .catch(async (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      await query(`update leads set wa_error = $1 where id = $2`, [msg, leadId]).catch(() => {});
    });

  return Response.json({ ok: true, saved: true });
}

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}
