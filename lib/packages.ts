// Single source of truth for all package data.
// Used by AI search, AI chat system prompts, OfferCard rendering, and the dashboard.

export const SECTION_IDS = ["dp", "fc", "dm", "cp"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export type PriceModel = "one-time" | "monthly";

export interface CognitionCycle {
  /** Display name e.g. "Cognition Cycle" */
  name: string;
  /** Per-cycle price */
  price: number;
  /** Pack size offered (e.g. 4) */
  packSize: number;
  /** Minimum gap between cycles, e.g. "1 month" */
  minGap: string;
  /** Short pitch line shown next to the price */
  pitch: string;
}


export interface HostingOption {
  type: "shared" | "dedicated";
  label: string;
  priceDelta: number; // ₹/mo added on top of base
  note?: string;
}

export interface PackageLevel {
  level: 1 | 2 | 3;
  name: string;
  tagline: string;
  price: number;
  priceModel: PriceModel;
  limitation: string;
  includes: string[];
  notIncluded: string[];
  /** fc packages only — required hosting choice that adds to monthly cost */
  hostingOptions?: HostingOption[];
  /** dm packages only — base price assumes 0 platforms; each platform adds this monthly */
  perPlatformPrice?: number;
}

export interface SectionData {
  id: SectionId;
  section: string;
  subtitle: string;
  icon: string;
  levels: PackageLevel[];
  featuredLevel: 1 | 2 | 3;
  /** Small footnote shown under each card in this section */
  footnote?: string;
  /** cp section only — Cognition Cycles add-on offered with every tier */
  cognitionCycle?: CognitionCycle;
  /** cp section only — single line of legal-grade trust copy shown above the row */
  trustStrip?: string;
  /** cp section only — the primary scheduler URL for the section CTA */
  calendlyUrl?: string;
  /** cp section only — the label on the section CTA */
  calendlyCta?: string;
}

export const PACKAGES: Record<SectionId, SectionData> = {
  dp: {
    id: "dp",
    section: "Online Presence",
    subtitle: "Website + Software + AI chat — built once",
    icon: "🌐",
    featuredLevel: 3,
    footnote: "One-time build fee. Domain purchase & yearly renewal billed separately (varies by domain).",
    levels: [
      {
        level: 1,
        name: "Website + Hosting",
        tagline: "For start-up companies",
        price: 3500,
        priceModel: "one-time",
        limitation: "3-page custom website · Shared hosting · SSL · Domain setup",
        includes: [
          "Custom 3-page website built for your business",
          "Managed shared hosting",
          "SSL certificate + domain connection",
          "Basic contact form",
          "Mobile responsive design",
          "1 revision cycle per month",
        ],
        notIncluded: ["Software", "AI Chatbot", "Lead tracking"],
      },
      {
        level: 2,
        name: "Website + Software",
        tagline: "For established companies",
        price: 8500,
        priceModel: "one-time",
        limitation: "Everything in L1 · Software up to 500 contacts · Pipeline · Reports",
        includes: [
          "Everything in Level 1",
          "Software setup — manage up to 500 contacts",
          "Lead tracking and pipeline view",
          "Reports and basic dashboards",
          "Automated follow-up reminders",
          "2 revision cycles per month",
        ],
        notIncluded: ["AI Chatbot", "24/7 query handling"],
      },
      {
        level: 3,
        name: "Website + Software + AI Chat",
        tagline: "For companies scaling with AI",
        price: 12500,
        priceModel: "one-time",
        limitation: "Everything in L2 · 1 AI chatbot · Up to 1,000 queries/mo · Software-linked",
        includes: [
          "Everything in Level 2",
          "Embedded AI chatbot on your website",
          "Handles up to 1,000 customer queries/month",
          "Integrates with your Software automatically",
          "Custom chat persona matching your brand",
          "Monthly chatbot performance report",
          "3 revision cycles per month",
        ],
        notIncluded: [],
      },
    ],
  },
  fc: {
    id: "fc",
    section: "Fully Online",
    subtitle: "Cloud hosting + Mobile app + AI operations",
    icon: "☁️",
    featuredLevel: 1,
    footnote: "One-time build fee. Managed shared hosting billed monthly. Domain purchase & yearly renewal billed separately.",
    levels: [
      {
        level: 1,
        name: "Cloud Infrastructure",
        tagline: "For businesses going digital-first",
        price: 15000,
        priceModel: "one-time",
        limitation: "Cloud hosting · 99.9% uptime SLA · Daily backups · Single region",
        includes: [
          "Full cloud-hosted website infrastructure",
          "99.9% uptime SLA guaranteed",
          "Daily automated backups — 7 day retention",
          "Auto-scaling on traffic spikes",
          "CDN integration for fast load times",
          "Monthly uptime + performance report",
        ],
        notIncluded: ["Mobile app", "AI operations", "Workflow automation"],
        hostingOptions: [
          { type: "shared", label: "Managed shared hosting", priceDelta: 750 },
        ],
      },
      {
        level: 2,
        name: "Cloud + Mobile App",
        tagline: "For businesses managing ops on the go",
        price: 18000,
        priceModel: "one-time",
        limitation: "Everything in L1 · Android app · Orders + inventory · Real-time sync",
        includes: [
          "Everything in Level 1",
          "Android mobile app for business operations",
          "Orders and inventory management module",
          "Team management via mobile",
          "Real-time sync between app and website",
          "Push notification support",
        ],
        notIncluded: ["AI-driven insights", "Workflow automation", "AI support agent"],
        hostingOptions: [
          { type: "shared", label: "Managed shared hosting", priceDelta: 750 },
        ],
      },
      {
        level: 3,
        name: "Cloud + App + AI Operations",
        tagline: "For businesses automating intelligently",
        price: 22000,
        priceModel: "one-time",
        limitation: "Everything in L2 · 3 AI automations · 1 AI support agent · Insights dashboard",
        includes: [
          "Everything in Level 2",
          "AI-driven business insights dashboard",
          "Up to 3 custom workflow automations",
          "AI support agent for your staff",
          "Anomaly detection and alerts",
          "Monthly automation performance review",
        ],
        notIncluded: [],
        hostingOptions: [
          { type: "shared", label: "Managed shared hosting", priceDelta: 1000, note: "AI workloads" },
        ],
      },
    ],
  },
  dm: {
    id: "dm",
    section: "Online Marketing",
    subtitle: "Grow your audience, consistently",
    icon: "📣",
    featuredLevel: 2,
    footnote: "Monthly base + ₹1,500/mo for each social platform you want us to run (Instagram, Facebook, LinkedIn, etc.). Same pricing whether you have a Shankara website or your own.",
    levels: [
      {
        level: 1,
        name: "Content Posting",
        tagline: "Start with a strong online presence",
        price: 4500,
        priceModel: "monthly",
        perPlatformPrice: 1500,
        limitation: "8 posts/mo · 2 blogs · AI visuals · Brand kit · Content calendar",
        includes: [
          "8 AI-generated social media posts per month",
          "2 long-form blog articles per month",
          "Branded visual creatives",
          "Monthly content calendar planned in advance",
          "Basic performance overview",
        ],
        notIncluded: ["DM management", "Comment replies", "Story management", "Ad campaigns"],
      },
      {
        level: 2,
        name: "Content + Community",
        tagline: "Stay present, build relationships",
        price: 8000,
        priceModel: "monthly",
        perPlatformPrice: 1500,
        limitation: "Everything in L1 · DMs managed · Comments replied · Stories",
        includes: [
          "Everything in Level 1",
          "Direct messages (DMs) managed and replied to",
          "Comments monitored and responded to",
          "Stories created and published weekly",
          "Chat/inbox management",
          "Weekly engagement summary",
        ],
        notIncluded: ["Paid ad campaigns", "ROI reporting"],
      },
      {
        level: 3,
        name: "Content + Community + Ads",
        tagline: "Reach new customers, drive results",
        price: 12000,
        priceModel: "monthly",
        perPlatformPrice: 1500,
        limitation: "Everything in L2 · Ad campaign management · ROI reporting · Ad spend separate",
        includes: [
          "Everything in Level 2",
          "Paid ad campaign setup and management",
          "Google, Meta, or Instagram (you choose)",
          "Targeting and audience optimisation",
          "Monthly ROI and performance report",
          "Your own ad spend billed separately to you",
        ],
        notIncluded: [],
      },
    ],
  },
  cp: {
    id: "cp",
    section: "Custom AI Agents",
    subtitle: "Ship an AI agent in 6 weeks. From your stack, in your stack.",
    icon: "🤖",
    featuredLevel: 2,
    footnote:
      "Built for mid-market B2B SaaS, D2C, Vertical SaaS, HealthTech and Creator/DevTools. Every tier ships in 6 weeks.",
    trustStrip:
      "Your data never leaves your VPC. We build against your schemas and architecture during dev (synthetic data only) and deploy the agent into your cloud account. Your customers' confidential data never lives on our infrastructure — ever.",
    calendlyUrl: "https://cal.com/shankara-run/intro",
    calendlyCta: "Ship an AI agent in 6 weeks →",
    cognitionCycle: {
      name: "Cognition Cycles",
      price: 10000,
      packSize: 4,
      minGap: "2 months",
      pitch:
        "Each cycle is a one-time ₹10,000 tune-up — call us when you want one. Up to 4 per year, with a minimum 2-month gap between cycles. The first cycle starts no earlier than 2 months after launch (the agent needs production traffic to learn from). Like a child's brain, your AI learns fastest in its first months — front-load the gains and save more in tokens than each cycle costs.",
    },
    levels: [
      {
        level: 1,
        name: "One AI Agent",
        tagline: "Ship one production agent into your stack",
        price: 28000,
        priceModel: "one-time",
        limitation: "6-week ship · 1 production agent · 30-day hypercare",
        includes: [
          "One production agent (LLM + tools + your data) deployed in your stack",
          "Evals + guardrails + observability dashboard",
          "Integration into your existing CRM / DB / API surface",
          "30-day post-ship hypercare + 1 iteration cycle",
        ],
        notIncluded: [
          "Multi-agent orchestration",
          "Dedicated founder time",
        ],
      },
      {
        level: 2,
        name: "Multi-Agent System",
        tagline: "2–3 agents orchestrated, shared memory, tool-calling",
        price: 36000,
        priceModel: "one-time",
        limitation: "6-week ship · 2–3 orchestrated agents · shared memory · production-grade",
        includes: [
          "Everything in Level 1",
          "2–3 agents orchestrated with shared memory + tool-calling layer",
          "Inter-agent handoff with eval-driven routing",
          "Shared vector store + Anthropic memory wiring",
          "Production monitoring + alerting on agent quality",
        ],
        notIncluded: ["Dedicated founder time"],
      },
      {
        level: 3,
        name: "Founder Pod",
        tagline: "3 weeks of Shankara, exclusively yours",
        price: 44000,
        priceModel: "one-time",
        limitation: "6-week ship · 3 weeks of dedicated founder time · only ~12–16 slots per year",
        includes: [
          "Everything in Level 2",
          "3 weeks of the founder, no parallel projects, no calendar conflicts",
          "Supporting team feeding the founder with implementation",
          "Whitelisted as your architect-of-record for the engagement",
          "Direct WhatsApp line to Shankara during the engagement",
        ],
        notIncluded: [],
      },
    ],
  },
};

export interface OfferData {
  sectionId: SectionId;
  sectionName: string;
  level: number;
  name: string;
  tagline: string;
  price: number;
}

export function lookupPackage(sectionId: SectionId, level: number): OfferData | null {
  const s = PACKAGES[sectionId];
  if (!s) return null;
  const lv = s.levels.find((l) => l.level === level);
  if (!lv) return null;
  return {
    sectionId,
    sectionName: s.section,
    level,
    name: lv.name,
    tagline: lv.tagline,
    price: lv.price,
  };
}

export const fmtPrice = (n: number): string => "₹" + n.toLocaleString("en-IN");

// Compact text representation for AI system prompts (saves tokens).
export const PACKAGE_KNOWLEDGE_TEXT = `Three sections, each with 3 stacking levels (each level includes everything in the prior).

ONLINE PRESENCE (id: dp) — ONE-TIME build fee. Domain purchase + yearly renewal billed separately.
- L1 Website + Hosting (₹3,500 one-time): 3-page site, shared hosting setup, SSL, contact form.
- L2 Website + Software (₹8,500 one-time): adds Software/CRM up to 500 contacts, lead pipeline, reports.
- L3 Website + Software + AI Chat (₹12,500 one-time): adds embedded AI chatbot, 1,000 queries/mo.

FULLY ONLINE / CLOUD (id: fc) — ONE-TIME build fee. Managed shared hosting is the only recurring cost. Domain billed separately.
- L1 Cloud Infrastructure: ₹15,000 one-time + ₹750/mo hosting
- L2 Cloud + Mobile App: ₹18,000 one-time + ₹750/mo hosting
- L3 Cloud + App + AI Operations: ₹22,000 one-time + ₹1,000/mo hosting (AI workloads)

CUSTOM AI AGENTS (id: cp) — ONE-TIME build fee. Every tier ships in 6 weeks. Built for mid-market B2B SaaS, D2C, Vertical SaaS, HealthTech and Creator/DevTools. Customer data never leaves their VPC.
- L1 One AI Agent (₹28,000 one-time): one production agent + evals + guardrails + observability + integration into their stack + 30-day hypercare.
- L2 Multi-Agent System (₹36,000 one-time, FEATURED): 2–3 agents orchestrated with shared memory + tool-calling layer + production monitoring.
- L3 Founder Pod (₹44,000 one-time): 3 weeks of Shankara exclusively (no parallel projects) + supporting team. Only ~12–16 slots per year.
- Optional COGNITION CYCLES (₹10,000 each, sold in 4-packs, min 1-month gap): monthly tune-ups that compound — most effective in the first months, saving more in tokens than they cost.

PAIRINGS
- Local shop / cafe / restaurant starting out → dp L1
- Established service business wanting leads + records → dp L2
- Customer-heavy business overwhelmed by inquiries → dp L3
- Multi-location ops, inventory, mobile → fc L1 or L2
- Funded SaaS / D2C / HealthTech needing an AI agent → cp L1 or L2
- Company treating AI as core IP (wants founder-led pod) → cp L3`;
