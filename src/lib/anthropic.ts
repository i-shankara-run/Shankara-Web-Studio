import Anthropic from "@anthropic-ai/sdk";
import type { LeadRow } from "./schemas";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const SYSTEM_PROMPT = `You write build-ready prompts for AI website builders (Lovable, v0, Bolt, Cursor Agent).

OUTPUT ONLY the prompt to give the builder. Do NOT add preamble, commentary, or wrap in markdown fences.

Target stack: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui. The site must be statically renderable for crawlability (use server components where possible).

The prompt MUST instruct the builder to produce:
- SEO metadata (title, description, OG image placeholder, JSON-LD LocalBusiness when applicable)
- Semantic HTML, mobile-first responsive layout
- Hero section (with headline drawn from the business description)
- Services / Offerings section
- About section
- Contact section with WhatsApp link (use placeholder +91XXXXXXXXXX)
- Footer with copyright
- Brand colors applied as CSS variables (--brand, --brand-shade) and used for buttons, links, accents
- Accessible: ARIA labels, alt text on images, sufficient contrast

Keep the generated prompt under 1500 words. Be specific. Give the builder the actual copy where possible.`;

interface PromptInput {
  business_name: string;
  business_desc: string;
  brand_color: string;
  brand_shade: string;
  packages: LeadRow["packages"];
  services_notes: string | null;
  online_urls: string[];
  research_notes: string | null;
  logo_url: string | null;
}

export async function generatePrompt(lead: LeadRow): Promise<string> {
  const input: PromptInput = {
    business_name: lead.business_name,
    business_desc: lead.business_desc,
    brand_color: lead.brand_color,
    brand_shade: lead.brand_shade,
    packages: lead.packages,
    services_notes: lead.services_notes,
    online_urls: lead.online_urls ?? [],
    research_notes: lead.research_notes,
    logo_url: lead.logo_url,
  };

  const userMessage = `Generate a build-ready prompt for the following business. Include any research notes and online presence to give the builder context.\n\n${JSON.stringify(input, null, 2)}`;

  const res = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = res.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Empty response from Anthropic");
  return text;
}
