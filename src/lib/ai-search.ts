import Anthropic from "@anthropic-ai/sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const BADGES = ["best-fit", "add-on", "also-worth"] as const;
const SECTION_IDS = ["dp", "fc", "dm"] as const;

export const aiSearchResultSchema = z.object({
  advisor: z.string().min(1).max(400),
  ranked: z
    .array(
      z.object({
        sectionId: z.enum(SECTION_IDS),
        level: z.number().int().min(1).max(3),
        reason: z.string().min(1).max(160),
        badge: z.enum(BADGES).optional(),
      }),
    )
    .min(1)
    .max(6),
});
export type AiSearchResult = z.infer<typeof aiSearchResultSchema>;

const SYSTEM_PROMPT = `You are Shankara — a respectful, sharp web-studio advisor matching small businesses to the right packages.

A visitor describes their business. Return STRICTLY a JSON object (no prose, no markdown fences) of this shape:
{
  "advisor": "<1–2 sentence friendly explanation of what fits and why, written in second person>",
  "ranked": [
    { "sectionId": "dp|fc|dm", "level": 1|2|3, "reason": "<short reason, under 16 words>", "badge": "best-fit|add-on|also-worth" }
  ]
}

Rules:
- "ranked" must have 3–6 items. Order by best fit first.
- Mark exactly ONE as "best-fit". Mark complementary cross-section picks as "add-on". Mark interesting alternatives as "also-worth".
- The "reason" is plain language. Avoid jargon.
- The "advisor" should sound human and warm, never salesy. Use their actual situation in the line.
- Do NOT quote prices. Do NOT promise dates.
- If the input is unclear or empty, return a sensible default fit and ask one clarifying question in the advisor line.

# PACKAGES
ONLINE PRESENCE (sectionId: "dp")
  L1 Website + Hosting — for new businesses needing a clean 3-page site
  L2 Website + Software — for established businesses tracking leads
  L3 Website + Software + AI Chat — for businesses with many incoming inquiries

FULLY ONLINE / CLOUD (sectionId: "fc") — for businesses running ops digitally
  L1 Cloud Infrastructure — for digital-first businesses needing uptime
  L2 Cloud + Mobile App — for businesses running ops on the go (multi-location, inventory, field team)
  L3 Cloud + App + AI Operations — for high-growth businesses automating workflows + AI insights

ONLINE MARKETING (sectionId: "dm") — can pair with any dp or fc
  L1 Content Posting — 8 social posts + 2 blogs/mo
  L2 Content + Community — adds DM, comments, stories on 2 platforms
  L3 Content + Community + Ads — adds paid ad campaign management

# COMMON PAIRINGS
- Cafe / restaurant / retail starting out → dp L1 (best-fit) + dm L1 (add-on)
- Established service business wanting leads → dp L2 (best-fit) + dm L2 (add-on)
- Customer-heavy business overwhelmed by inquiries → dp L3 (best-fit)
- Multi-location or inventory-heavy ops → fc L1 or L2 (best-fit)
- High-growth digital-first → fc L3 (best-fit) + dm L3 (add-on)
- Already has a website, wants growth → dm L1/L2/L3 (best-fit, standalone)

Return ONLY the JSON object. No other text.`;

export const aiSearchFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    const res = await getClient().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: data.query }],
    });
    const text = res.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();

    // Strip any accidental markdown fences and extract first JSON object.
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return JSON");
    const parsed = aiSearchResultSchema.safeParse(JSON.parse(match[0]));
    if (!parsed.success) {
      throw new Error(`AI returned malformed JSON: ${parsed.error.message}`);
    }
    // Stringify for transport (TanStack Start serializability dodge).
    return { json: JSON.stringify(parsed.data) };
  });

export function parseSearchResult(payload: { json: string }): AiSearchResult {
  return aiSearchResultSchema.parse(JSON.parse(payload.json));
}
