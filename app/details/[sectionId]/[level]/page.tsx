import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { DetailsClient } from "./client";
import {
  PACKAGES,
  SECTION_IDS,
  fmtPrice,
  lookupPackage,
  type SectionId,
} from "@/lib/packages";

interface PageParams {
  sectionId: string;
  level: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { sectionId, level } = await params;
  if (!SECTION_IDS.includes(sectionId as SectionId)) return { title: "Package not found" };
  const lv = Number(level);
  const pkg = lookupPackage(sectionId as SectionId, lv);
  if (!pkg) return { title: "Package not found" };
  return {
    title: `${pkg.name} — ${fmtPrice(pkg.price)}`,
    description: `${pkg.tagline}. Full feature list, comparison, and how this changes your business online.`,
  };
}

export async function generateStaticParams() {
  return SECTION_IDS.flatMap((id) =>
    PACKAGES[id].levels.map((lv) => ({ sectionId: id, level: String(lv.level) })),
  );
}

const GOOGLE_BENEFITS: Partial<Record<SectionId, string[]>> = {
  dp: [
    "Your business shows up in Google search for your name + city within 1–2 weeks",
    "Customers find you by service ('best web design Chennai') after we set up Google Business Profile",
    "Each page is built with semantic HTML + meta tags so Google can read and rank you",
    "Mobile-first — Google prioritises mobile-friendly sites in rankings",
  ],
  fc: [
    "99.9% uptime means Google never sees you as 'down' and de-ranks you",
    "Fast CDN load times help your Core Web Vitals score, which is a direct Google ranking factor",
    "Cloud auto-scaling handles traffic spikes when a viral post or ad sends visitors",
    "Daily backups protect your search rankings from accidental content loss",
  ],
  dm: [
    "Consistent posting signals an active business to social algorithms",
    "Each blog article is an SEO entry point — long-tail searches bring qualified visitors",
    "Comment + DM management turns viewers into customers within minutes",
    "Paid ads compound with organic reach over 3–6 months",
  ],
};

const ONLINE_STATS: Partial<Record<SectionId, { metric: string; before: string; after: string }[]>> = {
  dp: [
    { metric: "Customers can find you online", before: "0% (no listing)", after: "70-90% via Google" },
    { metric: "Time to first enquiry", before: "Days/weeks (word of mouth)", after: "Same week" },
    { metric: "Trust signal for new customers", before: "Hard to verify", after: "Real domain + SSL = legitimate" },
    { metric: "Hours/week answering FAQs", before: "5-10 hrs", after: "1-2 hrs (FAQ page handles rest)" },
  ],
  fc: [
    { metric: "Order processing", before: "Manual / phone", after: "Automated, real-time" },
    { metric: "Inventory accuracy", before: "Updated weekly", after: "Live, multi-device" },
    { metric: "Field team coordination", before: "WhatsApp chaos", after: "Mobile app with clear tasks" },
    { metric: "Reports for decisions", before: "End of month spreadsheet", after: "Dashboard, anytime" },
  ],
  dm: [
    { metric: "Posts per month", before: "Sporadic, 1-3", after: "8-12 planned, on-brand" },
    { metric: "Response time on DMs", before: "Hours/days", after: "Within 2 hours, monitored" },
    { metric: "Lead quality", before: "Random walk-ins", after: "Pre-qualified from targeted content" },
    { metric: "Ad ROI visibility", before: "Spending blind", after: "Monthly ROI report" },
  ],
};

const MARKETING_VALUE: Partial<Record<SectionId, string>> = {
  dp: "A great website without traffic is a closed shop with no signboard. Pair Online Presence with Online Marketing (dm) to bring visitors who'd never have found you otherwise.",
  fc: "Cloud infrastructure is the engine. Online Marketing is the fuel. Without consistent content + ads, your beautiful cloud-hosted operation stays a secret.",
  dm: "Marketing alone works if you already have a website. If you don't, pair this with Online Presence (dp L1) — you'll see 3-5x better lead quality when ads land on a real site instead of just a profile.",
};

// cp-specific content — replaces Google/Online-stats/Marketing sections for the AI Agents tier.
const CP_AI_BENEFITS: Record<number, string[]> = {
  1: [
    "One production-grade agent shipped in 6 weeks — not a slide, a working build in your repo",
    "Evals + guardrails on day one — you see quality numbers, not just vibes",
    "Wired into your existing CRM / DB / API — the agent talks to your real systems",
    "30-day hypercare after launch — bug fixes, prompt tuning, one iteration cycle included",
  ],
  2: [
    "2–3 agents orchestrated with shared memory + tool-calling — production multi-agent architecture",
    "Eval-driven routing — bad outputs blocked before they reach a user",
    "Anthropic memory + vector store wiring built in — the agents learn across sessions",
    "Production monitoring on agent quality, not just uptime",
  ],
  3: [
    "3 weeks of the founder, exclusively — no parallel projects, no calendar conflicts",
    "Whitelisted as your architect-of-record for the engagement",
    "Direct WhatsApp line to Shankara during the build",
    "Only ~12–16 slots per year — book early or wait a quarter",
  ],
};

const CP_TOKEN_ECON: { metric: string; before: string; after: string }[] = [
  { metric: "Time to a working agent", before: "3–6 months (Tier-1 SI)", after: "6 weeks (Shankara)" },
  { metric: "Where your data lives", before: "Vendor's cloud", after: "Your VPC, always" },
  { metric: "Who writes the code", before: "Rotating juniors", after: "Founder + senior engineers" },
  { metric: "After-launch cost trend", before: "Tokens grow with traffic", after: "Cognition Cycles cut tokens 30–60%" },
];

export default async function PackageDetailsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { sectionId, level } = await params;
  if (!SECTION_IDS.includes(sectionId as SectionId)) notFound();
  const lv = Number(level);
  const section = PACKAGES[sectionId as SectionId];
  const pkg = section.levels.find((l) => l.level === lv);
  if (!pkg) notFound();

  const sid = sectionId as SectionId;

  return (
    <>
      <Nav />
      <main className="details-page">
        <div className="details-inner">
          <Link href="/#packages" className="details-back">← Back to packages</Link>

          <header className="details-head">
            <span className="section-tag">{section.icon} {section.section}</span>
            <h1 className="details-title">{pkg.name}</h1>
            <p className="details-tagline">{pkg.tagline}</p>
            <div className="details-price-row">
              <div className="details-price">
                {fmtPrice(pkg.price)}
                <span className="details-price-period">
                  {pkg.priceModel === "one-time" ? " one-time" : "/mo"}
                </span>
              </div>
              {pkg.hostingOptions && pkg.hostingOptions[0] && (
                <div className="details-price-extra">
                  + {fmtPrice(pkg.hostingOptions[0].priceDelta)}/mo managed hosting
                </div>
              )}
              {pkg.perPlatformPrice && (
                <div className="details-price-extra">
                  + {fmtPrice(pkg.perPlatformPrice)}/mo per social platform
                </div>
              )}
            </div>
          </header>

          {/* What's included */}
          <section className="details-section">
            <h2 className="details-h2">Everything included</h2>
            <ul className="details-includes">
              {pkg.includes.map((f) => (
                <li key={f}>
                  <span className="details-tick" aria-hidden="true">✓</span> {f}
                </li>
              ))}
            </ul>
            {pkg.notIncluded.length > 0 && (
              <>
                <h3 className="details-h3">Not included at this level</h3>
                <ul className="details-not">
                  {pkg.notIncluded.map((f) => (
                    <li key={f}>— {f}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Hosting — single managed shared option for fc */}
          {pkg.hostingOptions && pkg.hostingOptions[0] && (
            <section className="details-section">
              <h2 className="details-h2">Hosting</h2>
              <div className="details-host-grid">
                <div className="details-host">
                  <strong>{pkg.hostingOptions[0].label}</strong>
                  <div className="details-host-price">
                    +{fmtPrice(pkg.hostingOptions[0].priceDelta)}<span className="sc-price-period">/mo</span>
                  </div>
                  <p className="details-host-note">
                    Managed shared hosting — we handle SSL renewal, patching, backups and uptime monitoring. Fine for up to ~2,000 visitors / month
                    {pkg.hostingOptions[0].note ? ` · ${pkg.hostingOptions[0].note}` : ""}.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Comparison with other levels */}
          <section className="details-section">
            <h2 className="details-h2">Compare with other levels</h2>
            <div className="details-compare">
              {section.levels.map((other) => {
                const isCurrent = other.level === pkg.level;
                return (
                  <div
                    key={other.level}
                    className={`details-compare-col${isCurrent ? " details-compare-current" : ""}`}
                  >
                    <div className="details-compare-head">
                      <span className="details-compare-level">Level {other.level}</span>
                      <strong>{other.name}</strong>
                      <div className="details-compare-price">
                        {fmtPrice(other.price)}
                        <small>{other.priceModel === "one-time" ? " one-time" : "/mo"}</small>
                      </div>
                    </div>
                    <ul className="details-compare-list">
                      {other.includes.slice(0, 5).map((f) => (
                        <li key={f}>✓ {f}</li>
                      ))}
                      {other.includes.length > 5 && (
                        <li className="details-compare-more">+ {other.includes.length - 5} more</li>
                      )}
                    </ul>
                    {!isCurrent && (
                      <Link
                        href={`/details/${section.id}/${other.level}`}
                        className="sc-cta-secondary details-compare-cta"
                      >
                        View Level {other.level}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* How this tier helps — cp gets its own narrative */}
          {sid === "cp" ? (
            <>
              <section className="details-section details-section-blue">
                <h2 className="details-h2">Why this tier — what you actually get</h2>
                <ul className="details-includes">
                  {(CP_AI_BENEFITS[pkg.level] ?? []).map((b) => (
                    <li key={b}>
                      <span className="details-tick" aria-hidden="true">✓</span> {b}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="details-section">
                <h2 className="details-h2">How we compare</h2>
                <div className="details-stats">
                  <div className="details-stats-head">
                    <div>Metric</div>
                    <div className="details-stats-before">Industry default</div>
                    <div className="details-stats-after">With Shankara</div>
                  </div>
                  {CP_TOKEN_ECON.map((s) => (
                    <div key={s.metric} className="details-stats-row">
                      <div className="details-stats-metric">{s.metric}</div>
                      <div className="details-stats-before">{s.before}</div>
                      <div className="details-stats-after">{s.after}</div>
                    </div>
                  ))}
                </div>
              </section>

              {section.trustStrip && (
                <section className="details-section details-marketing">
                  <h2 className="details-h2">Your data, your stack</h2>
                  <p className="details-marketing-body">{section.trustStrip}</p>
                </section>
              )}
            </>
          ) : (
            <>
              {GOOGLE_BENEFITS[sid] && (
                <section className="details-section details-section-blue">
                  <h2 className="details-h2">How being online actually helps you</h2>
                  <p className="details-section-sub">Google + the rest of the internet works for you in these ways:</p>
                  <ul className="details-includes">
                    {GOOGLE_BENEFITS[sid]!.map((b) => (
                      <li key={b}>
                        <span className="details-tick" aria-hidden="true">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {ONLINE_STATS[sid] && (
                <section className="details-section">
                  <h2 className="details-h2">What changes when you go online</h2>
                  <div className="details-stats">
                    <div className="details-stats-head">
                      <div>Metric</div>
                      <div className="details-stats-before">Before</div>
                      <div className="details-stats-after">After</div>
                    </div>
                    {ONLINE_STATS[sid]!.map((s) => (
                      <div key={s.metric} className="details-stats-row">
                        <div className="details-stats-metric">{s.metric}</div>
                        <div className="details-stats-before">{s.before}</div>
                        <div className="details-stats-after">{s.after}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {MARKETING_VALUE[sid] && (
                <section className="details-section details-marketing">
                  <h2 className="details-h2">Add marketing — multiplier effect</h2>
                  <p className="details-marketing-body">{MARKETING_VALUE[sid]}</p>
                  {sid !== "dm" && (
                    <Link href="/details/dm/2" className="sc-cta-secondary">
                      See Online Marketing →
                    </Link>
                  )}
                </section>
              )}
            </>
          )}

          {/* CTA */}
          <DetailsClient sectionId={sid} level={pkg.level} packageName={pkg.name} price={pkg.price} tagline={pkg.tagline} />
        </div>
      </main>
      <Footer />
    </>
  );
}
