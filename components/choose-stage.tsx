"use client";

import { useCallback } from "react";

const PILLS = [
  {
    title: "Just starting out",
    flag: "🇮🇳",
    sub: "Local or home business",
    href: "https://connect.shankara.website",
    external: true,
  },
  {
    title: "Launch Ready",
    sub: "New startup, need a web presence",
    target: "section-dp",
    external: false,
  },
  {
    title: "Cloud Scale",
    sub: "Growing, need infrastructure",
    target: "section-fc",
    external: false,
  },
  {
    title: "AI Enterprise",
    sub: "Corporate, ready for AI",
    target: "section-cp",
    external: false,
  },
] as const;

export function ChooseStage() {
  const goToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section id="choose-stage" className="cs-section">
      <div className="cs-inner">
        <span className="cs-overline">Choose your stage</span>
        <h2 className="cs-headline">Where does your business stand today?</h2>
        <div className="cs-pills">
          {PILLS.map((p) => {
            const content = (
              <>
                <span className="cs-pill-title">
                  {p.title}
                  {"flag" in p && p.flag && <span className="cs-pill-flag">{p.flag}</span>}
                </span>
                <span className="cs-pill-sub">{p.sub}</span>
              </>
            );
            if (p.external) {
              return (
                <a
                  key={p.title}
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="cs-pill"
                >
                  {content}
                </a>
              );
            }
            return (
              <button
                key={p.title}
                type="button"
                className="cs-pill"
                onClick={() => goToSection(p.target!)}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
