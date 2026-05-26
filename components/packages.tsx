"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PACKAGES, fmtPrice, type SectionId, type SectionData, type PackageLevel, lookupPackage, type OfferData } from "@/lib/packages";

interface PackagesProps {
  onStartDemo: (pkg: OfferData) => void;
  onViewDetails?: (sectionId: SectionId, level: number) => void;
}

function Check() {
  return (
    <span className="feat-check" aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function StairCard({
  section,
  lv,
  onStartDemo,
  onViewDetails,
}: {
  section: SectionData;
  lv: PackageLevel;
  onStartDemo: PackagesProps["onStartDemo"];
  onViewDetails?: PackagesProps["onViewDetails"];
}) {
  const featured = lv.level === section.featuredLevel;
  const visibleFeats = lv.includes.slice(0, 3);
  const remaining = lv.includes.length - 3;

  return (
    <article
      className={`sc-card sc-card-level-${lv.level}${featured ? " sc-card-featured" : ""}`}
    >
      {featured && <span className="sc-badge">Most Online</span>}
      <span className="sc-level">Level {lv.level}</span>
      <h3 className="sc-name">{lv.name}</h3>
      <p className="sc-tagline">{lv.tagline}</p>
      <div className="sc-price">
        {fmtPrice(lv.price)}
        <span className="sc-price-period">
          {lv.priceModel === "one-time" ? " one-time" : "/mo"}
        </span>
      </div>
      {lv.hostingOptions && lv.hostingOptions[0] && (
        <p className="sc-hosting-line">
          + <strong>{fmtPrice(lv.hostingOptions[0].priceDelta)}/mo</strong> managed hosting
          {lv.hostingOptions[0].note && (
            <span className="sc-hosting-note"> · {lv.hostingOptions[0].note}</span>
          )}
        </p>
      )}
      {lv.perPlatformPrice && (
        <p className="sc-hosting-line">
          + <strong>{fmtPrice(lv.perPlatformPrice)}/mo</strong> per social platform you pick
        </p>
      )}
      <p className="sc-limitation">{lv.limitation}</p>
      <div className="sc-divider" />
      <ul className="sc-feats">
        {visibleFeats.map((f) => (
          <li key={f}><Check />{f}</li>
        ))}
        {remaining > 0 && <li className="sc-more">+ {remaining} more</li>}
      </ul>
      <div className="sc-cta-row">
        <button
          type="button"
          className="sc-cta-primary"
          onClick={() => {
            const pkg = lookupPackage(section.id, lv.level);
            if (pkg) onStartDemo(pkg);
          }}
        >
          Get Free Demo
        </button>
        {onViewDetails && (
          <button
            type="button"
            className="sc-cta-secondary"
            onClick={() => onViewDetails(section.id, lv.level)}
          >
            View Full Details
          </button>
        )}
      </div>
    </article>
  );
}

function SectionBlock({
  section,
  onStartDemo,
  onViewDetails,
}: {
  section: SectionData;
  onStartDemo: PackagesProps["onStartDemo"];
  onViewDetails?: PackagesProps["onViewDetails"];
}) {
  return (
    <div id={`section-${section.id}`} className="sc-section">
      <div className="sc-section-head">
        <span className="sc-section-badge">{section.icon} {section.section}</span>
        <h3 className="sc-section-title">{section.subtitle}</h3>
      </div>
      {section.trustStrip && (
        <div className="sc-trust-strip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>{section.trustStrip}</span>
        </div>
      )}
      <div className="sc-row">
        {section.levels.map((lv) => (
          <StairCard
            key={lv.level}
            section={section}
            lv={lv}
            onStartDemo={onStartDemo}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
      {section.cognitionCycle && (
        <div className="sc-cycles">
          <div className="sc-cycles-head">
            <span className="sc-cycles-tag">Optional · Pay-per-cycle</span>
            <h4 className="sc-cycles-name">{section.cognitionCycle.name}</h4>
            <p className="sc-cycles-price">
              {fmtPrice(section.cognitionCycle.price)}<span> one-time per cycle</span>
              <em>· up to {section.cognitionCycle.packSize}/year · min {section.cognitionCycle.minGap} between cycles · first cycle 2 months after launch</em>
            </p>
          </div>
          <p className="sc-cycles-pitch">{section.cognitionCycle.pitch}</p>
        </div>
      )}
      {section.calendlyUrl && section.calendlyCta && (
        <a
          href={section.calendlyUrl}
          target="_blank"
          rel="noreferrer"
          className="sc-calendly-cta"
        >
          {section.calendlyCta}
        </a>
      )}
      {section.footnote && <p className="sc-footnote">{section.footnote}</p>}
    </div>
  );
}

export function Packages({ onStartDemo, onViewDetails }: PackagesProps) {
  const router = useRouter();
  const sections = [PACKAGES.dp, PACKAGES.fc, PACKAGES.cp];
  const handleViewDetails = useCallback(
    (sectionId: SectionId, level: number) => {
      if (onViewDetails) {
        onViewDetails(sectionId, level);
      } else {
        router.push(`/details/${sectionId}/${level}`);
      }
    },
    [onViewDetails, router],
  );

  return (
    <section id="packages" className="packages-section">
      <div className="packages-inner">
        <div className="packages-head">
          <span className="section-tag">Pricing</span>
          <h2 className="section-headline">Simple pricing for every stage.</h2>
          <p className="section-sub">
            Three services, three levels each. Each level includes everything from the one before — pick where you are now.
          </p>
        </div>
        {sections.map((s) => (
          <SectionBlock
            key={s.id}
            section={s}
            onStartDemo={onStartDemo}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </section>
  );
}
