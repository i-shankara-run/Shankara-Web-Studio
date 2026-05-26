import { z } from "zod";

const HEX = /^#[0-9a-fA-F]{6}$/;
const E164 = /^\+[1-9]\d{7,14}$/;

export const SECTION_IDS = ["dp", "fc", "dm"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const packageRefSchema = z.object({
  sectionId: z.enum(SECTION_IDS),
  level: z.number().int().min(1).max(3),
  name: z.string().min(1).max(80),
  price: z.number().int().min(0),
});

export const leadCreateSchema = z.object({
  businessName: z.string().min(2).max(120).trim(),
  businessDescription: z.string().min(2).max(400).trim(),
  whatsappE164: z.string().regex(E164, "Must be E.164 (e.g. +919876543210)"),
  brandColor: z.string().regex(HEX, "Brand color must be #RRGGBB"),
  brandShade: z.string().regex(HEX, "Brand shade must be #RRGGBB"),
  packages: z.array(packageRefSchema).min(1).max(5),
  consent: z.literal(true),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const LEAD_STATUSES = [
  "new",
  "researching",
  "prompt_generated",
  "demo_sent",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  servicesNotes: z.string().max(4000).optional(),
  onlineUrls: z.array(z.string().url().max(500)).max(20).optional(),
  researchNotes: z.string().max(4000).optional(),
  demoUrl: z.string().url().max(500).optional().or(z.literal("")),
  subdomain: z.string().max(120).optional(),
});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export interface LeadRow {
  id: string;
  created_at: string;
  updated_at: string;
  business_name: string;
  business_desc: string;
  whatsapp_e164: string;
  brand_color: string;
  brand_shade: string;
  packages: Array<{ sectionId: string; level: number; name: string; price: number }>;
  status: LeadStatus;
  logo_url: string | null;
  services_notes: string | null;
  online_urls: string[];
  research_notes: string | null;
  generated_prompt: string | null;
  demo_url: string | null;
  subdomain: string | null;
  wa_msg_id: string | null;
  wa_error: string | null;
}
