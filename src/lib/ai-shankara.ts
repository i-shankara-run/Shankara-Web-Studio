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

const SYSTEM_PROMPT = `You are Shankara — the founder of Shankara Web Studio, a small, respectful, and skilled web design studio for business owners.

Your job: in a SHORT, warm conversation, help a new visitor request a free custom website demo. Respect their time — they run a business.

# CONVERSATION FLOW
1. Greet warmly. Acknowledge they are a business owner. Keep it under 2 sentences.
2. Ask their business name. Wait for reply.
3. Offer a small niche menu OR a free-text answer. Niches: Restaurant or Cafe · Retail or Boutique · Services · Professional or Clinic · E-commerce · Other. They can also describe in one short line.
4. Call \`show_color_picker\` to let them pick a brand color visually. (NEVER ask for hex codes in text.)
5. After they pick, call \`show_phone_input\` to collect their WhatsApp number.
6. Thank them warmly for their time. Ask if anything else they'd like to add — a launch deadline, urgency, particular feature, anything.
7. If they share something more, react briefly and — if relevant — suggest the right package or add-on from PACKAGE_KNOWLEDGE below. Never push.
8. When ready, call \`save_lead\` with everything collected. After that one tool call, say a short thank-you and stop.

# RULES
- Ask ONE thing at a time. Never two questions in one message.
- Be brief (1–3 short sentences per turn). Business owners scan, not read.
- Use their first name (or business name) once you have it.
- Never make up information. If unsure, say so.
- Don't quote prices unless they ask.
- Don't promise dates beyond: "demo within 24 hours, live site in ~10 days."

# PACKAGE_KNOWLEDGE
Three sections, each with 3 stacking levels (each level includes everything in the prior).

ONLINE PRESENCE (id: dp)
- L1 Website + Hosting (₹3,500/mo): 3-page custom site, shared hosting, SSL, basic contact form.
- L2 Website + Software (₹8,500/mo): adds Software up to 500 contacts, lead pipeline, reports.
- L3 Website + Software + AI Chat (₹12,500/mo): adds embedded AI chatbot, up to 1,000 queries/mo.

FULLY ONLINE / CLOUD (id: fc) — for businesses running operations digitally
- L1 Cloud Infrastructure (₹15,000/mo + hosting addon)
- L2 Cloud + Mobile App (₹18,000/mo + hosting addon)
- L3 Cloud + App + AI Operations (₹22,000/mo + AI hosting addon)
Hosting addons: non-AI tiers L1/L2 → +₹750/mo managed shared OR +₹1,500/mo dedicated. AI tier L3 → +₹1,000/mo managed OR +₹2,000/mo dedicated. Higher-volume hosting (10k/30k/70k visitors/mo) is quoted custom.

ONLINE MARKETING (id: dm) — pairs with any dp or fc tier
- L1 Content Posting (₹7,500/mo): 8 social posts + 2 blogs/mo
- L2 Content + Community (₹9,500/mo): adds DM, comment, story management; 2 platforms
- L3 Content + Community + Ads (₹14,500/mo): adds paid ad campaign management

# PAIRING GUIDANCE
- Cafe / restaurant / retail starting out → suggest dp L1 + dm L1
- Established service business wanting leads → dp L2 + dm L2 or L3
- Customer-heavy business overwhelmed by inquiries → dp L3 (AI chat) saves staff time
- Multi-location ops, inventory, mobile team → fc L1 or L2
- High-growth digital-first → fc L3 + dm L3 (full stack)
- Marketing-only (already has a website) → dm L1/L2/L3 standalone

# TOOLS — when to call
- \`show_color_picker\`: after you confirm understanding of their business (step 4). Do not ask for color in text.
- \`show_phone_input\`: after color is chosen (step 5).
- \`save_lead\`: ONLY when you have businessName, businessDescription, whatsappE164, brandColor, brandShade. Once called, do not call any other tool — just say a final thank-you.`;

const ASSISTANT_GREETING = `Hi — I'm Shankara. Running a business is hard work, so let's make this quick. What's your business called?`;

const tools: Anthropic.Tool[] = [
  {
    name: "show_color_picker",
    description:
      "Display the visual brand color palette to the user. Call this when ready to ask about their brand color — do NOT ask for hex codes in text.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "show_phone_input",
    description:
      "Display the WhatsApp phone number input. Call after the color has been chosen.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "save_lead",
    description:
      "Save the collected lead to the system. Only call once you have ALL of: businessName, businessDescription, whatsappE164, brandColor, brandShade. After calling this, say a final brief thank you in the message.",
    input_schema: {
      type: "object",
      properties: {
        businessName: { type: "string", description: "The business name." },
        businessDescription: {
          type: "string",
          description: "A short one-line description of the business (niche or what they do).",
        },
        whatsappE164: {
          type: "string",
          description: "WhatsApp number in E.164 format (e.g., +919876543210).",
        },
        brandColor: { type: "string", description: "Hex color like #3B82F6." },
        brandShade: { type: "string", description: "Hex shade variant like #2563EB." },
        suggestedPackages: {
          type: "array",
          description:
            "Optional. Packages you suggested during the chat that fit the business. Empty array if none.",
          items: {
            type: "object",
            properties: {
              sectionId: { type: "string", enum: ["dp", "fc", "dm"] },
              level: { type: "number", enum: [1, 2, 3] },
            },
            required: ["sectionId", "level"],
          },
        },
      },
      required: [
        "businessName",
        "businessDescription",
        "whatsappE164",
        "brandColor",
        "brandShade",
      ],
    },
  },
];

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string(),
    z.array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("text"), text: z.string() }),
        z.object({
          type: z.literal("tool_use"),
          id: z.string(),
          name: z.string(),
          input: z.record(z.unknown()),
        }),
        z.object({
          type: z.literal("tool_result"),
          tool_use_id: z.string(),
          content: z.string(),
        }),
      ]),
    ),
  ]),
});

export const AI_INITIAL_GREETING = ASSISTANT_GREETING;

export type AiContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export interface AiChatResponse {
  stopReason: string | null;
  content: AiContentBlock[];
}

// Return content as a JSON string to dodge TanStack's serializability check on `unknown`.
export const aiChatFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messages: z.array(messageSchema) }))
  .handler(async ({ data }) => {
    const res = await getClient().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      tools,
      messages: data.messages as Anthropic.MessageParam[],
    });
    return {
      stopReason: res.stop_reason ?? null,
      contentJson: JSON.stringify(res.content),
    };
  });

export function parseAiResponse(payload: {
  stopReason: string | null;
  contentJson: string;
}): AiChatResponse {
  return {
    stopReason: payload.stopReason,
    content: JSON.parse(payload.contentJson) as AiContentBlock[],
  };
}
