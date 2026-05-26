const processCards = [
  { title: "One-Year Warranty", items: ["One-year warranty on all website functionalities.", "Any issues after launch resolved at no additional cost."], icon: "shield" },
  { title: "Advance Payment", items: ["Free demo first — see your site before you pay.", "If you love it, 50% upfront to start the build.", "Remaining balance only when your site goes live."], icon: "wallet" },
  { title: "Content Submission", items: ["You provide logo, text, product photos, and videos."], icon: "upload" },
  { title: "Layout Selection", items: ["Choose a layout before we begin.", "Provide a reference website, or our experts share template options."], icon: "layout" },
  { title: "Website Delivery", items: ["Your website will be ready within 10 working days."], icon: "rocket" },
  { title: "Source Files", items: ["Complete source files provided once your website goes live."], icon: "code" },
];

const iconMap: Record<string, React.ReactNode> = {
  shield: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/></svg>),
  wallet: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h2"/></svg>),
  upload: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>),
  layout: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></svg>),
  rocket: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M5 17c-1 2-1 4-1 4s2 0 4-1"/><path d="M19 5c1 4-1 9-5 13"/></svg>),
  code: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></svg>),
};

export function Process() {
  return (
    <section id="process" className="process-section">
      <div style={{ textAlign: "center" }}>
        <span className="section-tag">How we work</span>
        <h2 className="section-headline">A simple, predictable process.</h2>
        <p className="section-sub">Clear expectations from the first message to launch day.</p>
      </div>
      <div className="process-grid">
        {processCards.map((c) => (
          <article key={c.title} className="process-card">
            <div className="process-icon">{iconMap[c.icon]}</div>
            <h3>{c.title}</h3>
            <ul>{c.items.map((it) => <li key={it}>{it}</li>)}</ul>
          </article>
        ))}
      </div>
    </section>
  );
}
