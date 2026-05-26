import { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, HAIKU_MODEL } from "@/lib/anthropic";
import { query, queryOne } from "@/lib/db";
import { previewRunSchema, type LeadRow } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RUNS = 2;

// Curated Google Font pairs Claude is allowed to pick from. Keeping the
// universe small lets us preload them reliably and avoid weird font choices.
const FONT_PAIRS = [
  { display: "Playfair Display", body: "Inter" },
  { display: "Cormorant Garamond", body: "Lato" },
  { display: "DM Serif Display", body: "Inter" },
  { display: "Fraunces", body: "Inter" },
  { display: "Raleway", body: "Lato" },
  { display: "Bricolage Grotesque", body: "Inter" },
  { display: "Sora", body: "Inter" },
  { display: "Space Grotesk", body: "Inter" },
] as const;

const SYSTEM_PROMPT = `You are the brand-mark generator behind Shankara · run's "Run" preview gig. A small Indian business owner has typed their business name and a one-line description. Your job: return a polished tagline, pick a font pair, and pick ONE tiny accent character — that's it.

# RULES
- Tagline: 3–6 words, evocative, NOT generic. Avoid: "Welcome to", "Your destination for", "We provide". Prefer a small promise or a sensory detail. English unless the description suggests otherwise.
- Font pair: pick exactly one from this allowed list (display, body):
${FONT_PAIRS.map((p, i) => `  ${i + 1}. "${p.display}" + "${p.body}"`).join("\n")}
- Accent: a single unicode character that suits the brand — examples: ✦ ✧ ◇ · ◆ ✺ ❋ ❖ ➤ → ⌘ ⊹. Empty string if nothing fits.
- Match the font feel to the business type: handmade / boutique → serif (Playfair, Cormorant, Fraunces); food / cafe → warm display (DM Serif, Fraunces); tech / studio → modern sans (Sora, Space Grotesk, Bricolage); pro service → balanced (Raleway/Lato).
- Use the brand color as a vibe cue, not a literal constraint.

ALWAYS use the \`emit\` tool. Never reply in plain text.`;

const tools: Anthropic.Tool[] = [
  {
    name: "emit",
    description: "Emit the brand-mark output. Use exactly once.",
    input_schema: {
      type: "object",
      properties: {
        slogan: { type: "string", maxLength: 80 },
        fontDisplay: {
          type: "string",
          enum: FONT_PAIRS.map((p) => p.display),
        },
        fontBody: { type: "string", enum: FONT_PAIRS.map((p) => p.body) },
        accent: { type: "string", maxLength: 3 },
      },
      required: ["slogan", "fontDisplay", "fontBody", "accent"],
    },
  },
];

interface EmitOutput {
  slogan: string;
  fontDisplay: string;
  fontBody: string;
  accent: string;
}

function pickEmit(content: Anthropic.ContentBlock[]): EmitOutput | null {
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "emit") {
      const i = block.input as Record<string, unknown>;
      const slogan = typeof i.slogan === "string" ? i.slogan : null;
      const fontDisplay = typeof i.fontDisplay === "string" ? i.fontDisplay : null;
      const fontBody = typeof i.fontBody === "string" ? i.fontBody : null;
      const accent = typeof i.accent === "string" ? i.accent : "";
      if (slogan && fontDisplay && fontBody) {
        return { slogan, fontDisplay, fontBody, accent };
      }
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = previewRunSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Find existing preview lead (if leadId provided) or null.
  // DB is optional — if Postgres isn't reachable we still generate and return
  // a synthetic leadId so the gig works offline (preview is unsaved).
  let lead: LeadRow | null = null;
  let dbDown = false;
  if (d.leadId) {
    try {
      lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [d.leadId]);
    } catch (e) {
      console.warn("preview/run lead lookup failed (continuing without DB):", e);
      dbDown = true;
    }
    if (lead && lead.status !== "preview") {
      return Response.json(
        { error: "This session has already been promoted." },
        { status: 409 },
      );
    }
    if (lead && lead.run_count >= MAX_RUNS) {
      return Response.json(
        { error: "Run quota exhausted. Drop your WhatsApp to keep generating." },
        { status: 429 },
      );
    }
  }

  // Generate via Claude
  let out: EmitOutput | null = null;
  try {
    const res = await getAnthropic().messages.create({
      model: HAIKU_MODEL,
      max_tokens: 400,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      tools,
      tool_choice: { type: "tool", name: "emit" },
      messages: [
        {
          role: "user",
          content: `Business name: ${d.businessName}\nWhat they do: ${d.businessDescription}\nBrand color: ${d.brandColor} (shade ${d.brandShade}).`,
        },
      ],
    });
    out = pickEmit(res.content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("preview/run anthropic failed:", msg);
    return Response.json({ error: "Generation failed" }, { status: 502 });
  }

  if (!out) {
    return Response.json({ error: "Generator returned no output." }, { status: 502 });
  }

  // Upsert lead row. If the DB is down, fall back to a synthetic id so the
  // user still sees the generation — the lead just won't be persisted.
  let leadId: string;
  let runCount: number;
  if (dbDown) {
    leadId = (d.leadId ?? crypto.randomUUID());
    runCount = (lead?.run_count ?? 0) + 1;
  } else if (lead) {
    try {
      const row = await queryOne<{ id: string; run_count: number }>(
        `update leads set
           business_name = $1, business_desc = $2,
           brand_color = $3, brand_shade = $4,
           generated_slogan = $5, font_display = $6, font_body = $7, accent_emoji = $8,
           run_count = run_count + 1, last_run_at = now()
         where id = $9
         returning id, run_count`,
        [
          d.businessName,
          d.businessDescription,
          d.brandColor,
          d.brandShade,
          out.slogan,
          out.fontDisplay,
          out.fontBody,
          out.accent,
          lead.id,
        ],
      );
      if (!row) {
        leadId = lead.id;
        runCount = lead.run_count + 1;
      } else {
        leadId = row.id;
        runCount = row.run_count;
      }
    } catch (e) {
      console.warn("preview/run update failed (continuing offline):", e);
      leadId = lead.id;
      runCount = lead.run_count + 1;
    }
  } else {
    try {
      const row = await queryOne<{ id: string; run_count: number }>(
        `insert into leads
           (business_name, business_desc, brand_color, brand_shade,
            generated_slogan, font_display, font_body, accent_emoji,
            packages, run_count, last_run_at, status)
         values ($1, $2, $3, $4, $5, $6, $7, $8, '[]'::jsonb, 1, now(), 'preview'::lead_status)
         returning id, run_count`,
        [
          d.businessName,
          d.businessDescription,
          d.brandColor,
          d.brandShade,
          out.slogan,
          out.fontDisplay,
          out.fontBody,
          out.accent,
        ],
      );
      if (!row) {
        leadId = crypto.randomUUID();
        runCount = 1;
      } else {
        leadId = row.id;
        runCount = row.run_count;
      }
    } catch (e) {
      console.warn("preview/run insert failed (continuing offline):", e);
      leadId = crypto.randomUUID();
      runCount = 1;
    }
  }

  return Response.json({
    leadId,
    slogan: out.slogan,
    fontDisplay: out.fontDisplay,
    fontBody: out.fontBody,
    accent: out.accent,
    runsRemaining: Math.max(0, MAX_RUNS - runCount),
  });
}

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}
