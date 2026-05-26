import { z } from "zod";
import { SECTION_IDS, type SectionId } from "./packages";

const HEX = /^#[0-9a-fA-F]{6}$/;
const E164 = /^\+[1-9]\d{7,14}$/;

export const packageRefSchema = z.object({
  sectionId: z.enum(SECTION_IDS),
  level: z.number().int().min(1).max(3),
  name: z.string().min(1).max(80),
  price: z.number().int().min(0),
});

export const leadCreateSchema = z.object({
  businessName: z.string().min(2).max(120).trim(),
  businessDescription: z.string().min(2).max(400).trim(),
  whatsappE164: z.string().regex(E164, "Must be E.164"),
  brandColor: z.string().regex(HEX),
  brandShade: z.string().regex(HEX),
  packages: z.array(packageRefSchema).min(1).max(5),
  consent: z.literal(true),
  searchContext: z.string().max(2000).optional(),
  dashboardPrompt: z.string().max(20000).optional(),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const LEAD_STATUSES = [
  "preview", "new", "researching", "prompt_generated", "demo_sent", "won", "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const previewRunSchema = z.object({
  businessName: z.string().min(1).max(120).trim(),
  businessDescription: z.string().min(2).max(400).trim(),
  brandColor: z.string().regex(HEX),
  brandShade: z.string().regex(HEX),
  leadId: z.string().uuid().optional(),
});
export type PreviewRunInput = z.infer<typeof previewRunSchema>;

export const previewPromoteSchema = z.object({
  leadId: z.string().uuid(),
  whatsappE164: z.string().regex(E164, "Must be E.164"),
});
export type PreviewPromoteInput = z.infer<typeof previewPromoteSchema>;

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  servicesNotes: z.string().max(4000).optional(),
  onlineUrls: z.array(z.string().url().max(500)).max(20).optional(),
  researchNotes: z.string().max(4000).optional(),
  demoUrl: z.string().url().max(500).optional().or(z.literal("")),
  subdomain: z.string().max(120).optional(),
  generatedPrompt: z.string().max(20000).optional(),
});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export interface LeadRow {
  id: string;
  created_at: string;
  updated_at: string;
  business_name: string;
  business_desc: string;
  whatsapp_e164: string | null;
  brand_color: string;
  brand_shade: string;
  packages: Array<{ sectionId: SectionId; level: number; name: string; price: number }>;
  status: LeadStatus;
  logo_url: string | null;
  services_notes: string | null;
  online_urls: string[];
  research_notes: string | null;
  generated_prompt: string | null;
  demo_url: string | null;
  subdomain: string | null;
  search_context: string | null;
  wa_msg_id: string | null;
  wa_error: string | null;
  generated_slogan: string | null;
  font_display: string | null;
  font_body: string | null;
  accent_emoji: string | null;
  run_count: number;
  last_run_at: string | null;
}
