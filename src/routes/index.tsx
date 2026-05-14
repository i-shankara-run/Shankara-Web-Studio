import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { HeroScene } from "@/components/HeroScene";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shankara — Your Business Deserves to Be Online" },
      { name: "description", content: "Shankara designs and ships interactive websites with honest pricing, a one-year warranty, and a 10-day delivery promise." },
      { property: "og:title", content: "Shankara — Web Design Studio, Chennai" },
      { property: "og:description", content: "Websites that work as hard as you do. Launch, Grow, and Scale packages." },
    ],
  }),
  component: Index,
});

const processCards = [
  { title: "One-Year Warranty", items: ["One-year warranty on all website functionalities.", "Any issues after launch resolved at no additional cost during the warranty period."], icon: "shield" },
  { title: "Advance Payment", items: ["50% upfront payment required to initiate the project.", "Remaining balance paid on or before the website goes live."], icon: "wallet" },
  { title: "Content Submission", items: ["You provide logo, text, product photos, and videos for your website."], icon: "upload" },
  { title: "Layout Selection", items: ["Choose a layout before we begin.", "Provide a reference website, or our experts share template options."], icon: "layout" },
  { title: "Website Delivery", items: ["Your website will be ready within 10 working days."], icon: "rocket" },
  { title: "Source Files", items: ["Complete source files provided once your website goes live."], icon: "code" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const map: Record<string, ReactElement> = {
    shield: <svg {...common}><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/></svg>,
    wallet: <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h2"/></svg>,
    upload: <svg {...common}><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>,
    layout: <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></svg>,
    rocket: <svg {...common}><path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M5 17c-1 2-1 4-1 4s2 0 4-1"/><path d="M19 5c1 4-1 9-5 13"/></svg>,
    code: <svg {...common}><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></svg>,
  };
  return map[name];
}

const launchFeats = [".in Domain Registration", "Web Hosting", "Professional Email", "Basic SSL Certificate", "Start-Up Website", "Complimentary Logo"];
const launchFound: [string, string][] = [
  ["Professional Domain-Based Email", "Build trust with clients using an official email address linked to your domain name."],
  ["Secure Domain Ownership", "Domain registered under your ownership — full control and your digital identity safeguarded."],
  ["Online Presence on Google", "When potential clients search for your name, they'll find your website displaying essential details."],
  ["Free Logo & Brand Identity", "A complimentary logo design to establish your brand identity at no extra cost."],
];

const growFeats = ["Everything in Start-Up", "Custom Business Website", "CRM Integration", "Billing Software", "Google Analytics", "WhatsApp Enquiry Button", "SEO-Ready Structure", "Mobile Optimised"];
const growFound: [string, string][] = [
  ["Built Around Your Brand", "Custom-designed pages that reflect your business identity, products, and services precisely."],
  ["CRM — Manage Your Leads", "Track contacts, deals, and follow-ups from one place. Never lose a client opportunity again."],
  ["Billing & Invoicing, Simplified", "Send quotes, invoices, and payment links directly from your business platform."],
  ["Rank Higher, Reach Further", "SEO-ready architecture and analytics so you're found by the right people at the right time."],
];

const scaleFeats = ["Everything in Business", "AI Chat on Website", "WhatsApp AI Integration", "Analytics Dashboard", "Automated Lead Capture", "24/7 AI Customer Response", "Custom AI Model Training", "Monthly Performance Reports"];
const scaleFound: [string, string][] = [
  ["AI Chat — Always On", "An AI assistant trained on your business responds to enquiries instantly, day and night."],
  ["WhatsApp Business AI", "Automate responses, bookings, and lead qualification on WhatsApp — fully hands-free."],
  ["Business Intelligence Dashboard", "See who's visiting, what they're asking, and where leads come from — in one clear view."],
  ["Continuous AI Improvement", "Monthly model updates keep your AI sharp and your business moving forward every month."],
];

function Check() {
  return (
    <span className="feat-check">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function PackageBlock({
  variant, num, badge, name, price, note, desc, feats, found,
}: {
  variant: "launch" | "grow" | "scale";
  num: string; badge: string; name: string; price: string; note: string; desc: string;
  feats: string[]; found: [string, string][];
}) {
  return (
    <section className={`pkg-section pkg-${variant}`}>
      <Reveal>
        <div className="pkg-grid relative">
          <div className="relative">
            <div className="pkg-ghost">{num}</div>
            <span className="pkg-badge"><span className="dot" />{badge}</span>
            <h3 className="pkg-name" style={variant === "scale" ? { color: "#fff" } : undefined}>{name}</h3>
            <div className="pkg-price">{price}</div>
            <p className="pkg-note">{note}</p>
            <p className="pkg-desc">{desc}</p>
            <a href="#contact" className={variant === "scale" ? "btn-ghost-light" : "btn-fill"}>Enquire Now →</a>
          </div>
          <div>
            <div className="feat-box">
              <div className="feat-label">Package Includes</div>
              <ul className="feat-list">
                {feats.map((f) => (<li key={f}><Check />{f}</li>))}
              </ul>
            </div>
            <ul className="list-none p-0 m-0">
              {found.map(([h, p], i) => (
                <li key={h} className="found-item">
                  <div className="found-num">{i + 1}</div>
                  <div className="found-content">
                    <h5 style={variant === "scale" ? { color: "#fff" } : undefined}>{h}</h5>
                    <p>{p}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Index() {
  return (
    <div id="top">
      <Nav />

      {/* HERO */}
      <header className="hero hero-wrap">
        <div className="relative z-10">
          <div className="eyebrow animate-rise" style={{ animationDelay: ".1s" }}>Web Design Studio · Chennai</div>
          <h1 className="animate-rise" style={{ animationDelay: ".25s" }}>
            Your business
            <em>deserves to be online.</em>
          </h1>
          <p className="hero-body animate-rise" style={{ animationDelay: ".4s" }}>
            Shankara designs and ships interactive websites that work as hard as you do — with honest pricing, a one-year warranty, and a 10-day delivery promise.
          </p>
          <div className="flex flex-wrap gap-3 mb-10 animate-rise" style={{ animationDelay: ".55s" }}>
            <a href="#packages" className="btn-fill">See packages →</a>
            <a href="#process" className="btn-outline">How we work</a>
          </div>
          <div className="flex flex-wrap gap-2 animate-rise" style={{ animationDelay: ".7s" }}>
            <span className="pill">Websites that work as hard as you do</span>
            <span className="pill">10-day delivery</span>
            <span className="pill">One-year warranty</span>
            <span className="pill">Honest pricing</span>
          </div>
        </div>
        <div className="animate-fade" style={{ animationDelay: ".5s" }}>
          <HeroScene />
        </div>
      </header>

      {/* PROCESS */}
      <section id="process" className="px-[5%] py-24 bg-white">
        <Reveal>
          <span className="section-tag">How we work</span>
          <h2 className="section-headline">A simple, predictable process.</h2>
          <p className="section-sub mb-14">Clear expectations from the first message to launch day. Here's exactly how we work with you.</p>
        </Reveal>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))" }}>
          {processCards.map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <div className="pcard h-full">
                <div className="pcard-icon"><Icon name={c.icon} /></div>
                <h3>{c.title}</h3>
                <ul>{c.items.map((it) => <li key={it}>{it}</li>)}</ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* JOURNEY HEADER */}
      <section id="packages" className="text-center pt-24 px-[5%]" style={{ background: "#f4f7fb" }}>
        <Reveal>
          <span className="section-tag">Your business journey</span>
          <h2 className="section-headline">Three stages. One journey.</h2>
          <p className="section-sub mx-auto">Start where you are. Build what you need. Scale when you're ready.</p>
        </Reveal>
        <div className="tl-strip">
          <a href="#launch" className="tl-node"><div className="tl-bubble sz1"><div className="tl-stage">Launch</div><div className="tl-amt">₹3,500</div></div><div className="tl-label">Start-Up</div></a>
          <div className="tl-rule" />
          <a href="#grow" className="tl-node"><div className="tl-bubble sz2"><div className="tl-stage">Grow</div><div className="tl-amt">₹8,500</div></div><div className="tl-label">Business</div></a>
          <div className="tl-rule" />
          <a href="#scale" className="tl-node"><div className="tl-bubble sz3"><div className="tl-stage">Scale</div><div className="tl-amt">₹12,500</div></div><div className="tl-label">AI Model</div></a>
        </div>
        <div className="h-24" />
      </section>

      <div id="launch">
        <PackageBlock variant="launch" num="01" badge="Launch Stage" name={"All-Inclusive\nStart-Up Package"} price="₹3,500" note="One-time payment"
          desc="Not ready for a full-scale business website? Get a professional email with your own domain — plus a clean startup website to establish your presence from day one."
          feats={launchFeats} found={launchFound} />
      </div>
      <div id="grow">
        <PackageBlock variant="grow" num="02" badge="Grow Stage" name={"Business\nCustom Package"} price="₹8,500" note="One-time payment"
          desc="Your business is unique — your website should be too. A fully custom-built site with CRM and billing tools to manage leads, send invoices, and grow efficiently."
          feats={growFeats} found={growFound} />
      </div>
      <div id="scale">
        <PackageBlock variant="scale" num="03" badge="Scale Stage · AI" name={"Fully AI-Powered\nBusiness Model"} price="₹12,500" note="One-time + ₹1,000 / month AI service charge"
          desc="The future of business is AI-driven. Automate customer interactions, capture leads 24/7, and make data-backed decisions — all integrated into your business model."
          feats={scaleFeats} found={scaleFound} />
      </div>

      {/* CONTACT */}
      <section id="contact" className="text-center px-[5%] py-24 bg-white">
        <Reveal>
          <span className="section-tag">Get started</span>
          <h2 className="section-headline mx-auto" style={{ maxWidth: 540 }}>Ready to take your business online?</h2>
          <p className="section-sub mx-auto mb-10">Tell us about your business and we'll recommend the right package — no obligation, no hard sell, just honest advice.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="btn-wa">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M.057 24l1.687-6.163A11.867 11.867 0 0 1 .002 11.86C0 5.32 5.335.001 11.892.001A11.821 11.821 0 0 1 23.787 11.88c-.003 6.54-5.339 11.86-11.893 11.86a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.881.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.881-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.982z"/></svg>
              WhatsApp Us
            </a>
            <a href="mailto:hello@shankara.in" className="btn-outline">Send an Email</a>
          </div>
        </Reveal>
      </section>

      <footer className="site-footer">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <img src={logo} alt="Shankara" className="w-9 h-6 object-contain opacity-80" />
          <span className="font-serif text-xl font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>Shankara</span>
        </div>
        <p className="text-sm font-light mb-5">Websites that work as hard as you do.</p>
        <div className="flex justify-center gap-8 mb-5">
          <a href="#top" className="footer-link">Home</a>
          <a href="#process" className="footer-link">Process</a>
          <a href="#packages" className="footer-link">Packages</a>
          <a href="#contact" className="footer-link">Contact</a>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,.25)" }}>© 2026 Shankara Web Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}
