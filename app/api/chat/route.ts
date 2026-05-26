import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getAnthropic, HAIKU_MODEL } from "@/lib/anthropic";
import { PACKAGE_KNOWLEDGE_TEXT } from "@/lib/packages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Shankara — the founder of Shankara · run, a focused, professional web design studio for Indian small businesses.

TONE: composed, precise, professional. Like a senior consultant who respects the customer's time. Brief — 1–2 short sentences per turn. Warm but no fluff.

# GREETING (FIRST TURN ONLY)
When the customer's first message is a generic opener (e.g. "I'd like a free demo for my business"), respond with EXACTLY this opener:

"Hi! Thanks for reaching out to Shankara 👋 Tell me about your business — I'll prepare a free website mockup within 24 hours. What type of shop do you run?"

Then immediately call \`show_chips\` with EXACTLY these four business-type chips (no "I'm not sure" — every customer has a business; if they truly don't, they shouldn't be here):
  ["Retail shop or store", "Cafe or restaurant", "Service business", "Clinic or salon"]

# CONVERSATION FLOW (TURNS AFTER GREETING)
- Acknowledge their answer in 1 sentence.
- If they picked a niche/topic, call \`show_benefits\` with 3-4 outcome-focused bullets in customer language. Example for retail shop: ["Digital customer book included", "Track every customer automatically", "All records in one place", "Never lose a sale again"]
- Then call \`show_chips\` with 2-4 related follow-up options under 60 chars each. Make these specific to their business type.
- After 2-3 turns of helpful back-and-forth, transition: call \`request_business_details\` with a short message like: "To prepare your custom demo, I just need your business name and a quick description. This helps me research your space."
- After business details are received: call \`show_color_picker\` to capture brand color.
- After color is captured: call \`show_phone_input\` to capture WhatsApp number, with message like: "Last thing — could you share your WhatsApp number?"
- Call \`save_lead\` with everything.
- After save_lead, respond ONLY with: "Thank you. Shankara will get back to you very soon with a demo prototype."

# CHIP EXAMPLES BY BUSINESS TYPE (use show_chips judiciously)
Retail/shop: ["Website with billing", "GST invoicing", "Customer loyalty", "Daily sales report"]
Cafe/restaurant: ["Menu on website", "Online orders", "WhatsApp orders", "Show daily specials"]
Clinic/professional: ["Appointment booking", "Patient records", "Auto reminders", "Online consultations"]
E-commerce: ["Product catalog", "Online payments", "Inventory sync", "Order tracking"]
Service business: ["Lead capture form", "Quote calculator", "WhatsApp leads", "Customer reviews"]
"Don't know" / curious: ["What's the simplest start?", "How long does it take?", "Pricing breakdown", "Talk to a human"]

# RULES
- ALWAYS call show_chips after replying — never leave the customer with just text. Chips guide the conversation.
- Each chip MUST be under 60 characters. Use customer language, not technical jargon.
- ONE thing per turn. Never ask two questions together.
- Maximum 2 sentences per text reply. Use show_benefits for lists.
- Don't promise dates beyond: "demo within 24 hours, live site in ~10 days."

# PRICING QUESTIONS — NEVER DUMP A PRICE LIST
When the customer asks about price/pricing/cost/packages:
- Pick the SINGLE best-fit package for them based on what they've told you (their business type + needs so far).
- Call \`recommend_package\` with sectionId + level + a 1-sentence "why this one" message.
- Do NOT enumerate other packages. Do NOT show ₹ figures in plain text. The recommendation card handles all of that.
- After recommend_package, your text reply should be one short line like "For a {business type} like yours, this is where I'd start." Then chips: ["View package details", "Get my free demo"].
- If the customer asks about a SPECIFIC level (e.g. "tell me more about L2"), call recommend_package with that exact level.

# PACKAGE KNOWLEDGE (use only when they ask)
${PACKAGE_KNOWLEDGE_TEXT}

USE THE TOOLS. Never fake widgets, chips, or bullets in plain text.`;

const tools: Anthropic.Tool[] = [
  {
    name: "show_chips",
    description:
      "Show 2–4 clickable chip options to the user (e.g. follow-up topics, niche choices, related searches). Each chip MUST be under 60 characters. Use this often — chips guide the conversation and reduce typing. Customer clicks a chip, which becomes their next message.",
    input_schema: {
      type: "object",
      properties: {
        chips: {
          type: "array",
          items: { type: "string", maxLength: 60 },
          minItems: 2,
          maxItems: 5,
          description: "Short, scannable options the user can tap.",
        },
      },
      required: ["chips"],
    },
  },
  {
    name: "recommend_package",
    description:
      "Recommend exactly ONE package to the customer. Use whenever they ask about price/cost/packages, or whenever the conversation is clearly converging on a specific level. Renders a rich card with price, what's included, and 'View details' + 'Get free demo' buttons. NEVER respond to a pricing question with text-only ₹ figures — always use this tool.",
    input_schema: {
      type: "object",
      properties: {
        sectionId: {
          type: "string",
          enum: ["dp", "fc", "dm"],
          description: "dp=Online Presence, fc=Fully Online/Cloud, dm=Online Marketing.",
        },
        level: { type: "integer", enum: [1, 2, 3] },
        why: {
          type: "string",
          maxLength: 140,
          description: "One short sentence on why this level fits THIS customer, in their language.",
        },
      },
      required: ["sectionId", "level", "why"],
    },
  },
  {
    name: "show_benefits",
    description:
      "Show 3-4 short benefit bullets relevant to the customer's situation. Each bullet under 60 chars. Use when you want to highlight outcomes without writing a paragraph.",
    input_schema: {
      type: "object",
      properties: {
        bullets: {
          type: "array",
          items: { type: "string", maxLength: 60 },
          minItems: 3,
          maxItems: 5,
        },
      },
      required: ["bullets"],
    },
  },
  {
    name: "request_business_details",
    description:
      "Show a combined input box asking for the customer's business name AND a short description in one widget. Use when ready to start collecting demo info. Promise it helps Shankara research them for the demo.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "show_color_picker",
    description:
      "Display the visual brand color palette. Call after business name + description are captured. NEVER ask for hex in text.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "show_phone_input",
    description: "Display the WhatsApp phone number input. Call after color is chosen.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "save_lead",
    description:
      "Save the lead. Only call after you have businessName + businessDescription + whatsappE164 + brandColor + brandShade. After this, say exactly: 'Thank you. Shankara will get back to you very soon with a demo prototype.'",
    input_schema: {
      type: "object",
      properties: {
        businessName: { type: "string" },
        businessDescription: { type: "string" },
        whatsappE164: { type: "string", description: "E.164 format like +919876543210." },
        brandColor: { type: "string", description: "Hex like #3B82F6." },
        brandShade: { type: "string" },
      },
      required: ["businessName", "businessDescription", "whatsappE164", "brandColor", "brandShade"],
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

export async function POST(req: NextRequest) {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z
    .object({
      messages: z.array(messageSchema),
      context: z
        .object({
          businessDescription: z.string().optional(),
          selectedPackage: z
            .object({
              name: z.string(),
              sectionId: z.string(),
              level: z.number(),
            })
            .optional(),
        })
        .optional(),
    })
    .safeParse(bodyJson);

  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  const ctxLines: string[] = [];
  if (parsed.data.context?.businessDescription) {
    ctxLines.push(`The customer described their business as: "${parsed.data.context.businessDescription}"`);
  }
  if (parsed.data.context?.selectedPackage) {
    const p = parsed.data.context.selectedPackage;
    ctxLines.push(`They selected the "${p.name}" package (sectionId=${p.sectionId}, level=${p.level}).`);
  }
  const contextBlock = ctxLines.length ? `\n\n# THIS SESSION'S CONTEXT\n${ctxLines.join("\n")}` : "";

  try {
    const res = await getAnthropic().messages.create({
      model: HAIKU_MODEL,
      max_tokens: 800,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        ...(contextBlock
          ? [{ type: "text" as const, text: contextBlock }]
          : []),
      ],
      tools,
      messages: parsed.data.messages as Anthropic.MessageParam[],
    });

    return Response.json({
      stopReason: res.stop_reason ?? null,
      content: res.content,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("AI chat failed:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
