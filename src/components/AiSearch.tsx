import { useCallback, useState, useTransition } from "react";
import { aiSearchFn, parseSearchResult, type AiSearchResult } from "@/lib/ai-search";

export type AiSearchSectionId = "dp" | "fc" | "dm";

export interface OfferData {
  sectionId: AiSearchSectionId;
  sectionName: string;
  level: number;
  name: string;
  tagline: string;
  price: number;
}

interface AiSearchProps {
  lookupPackage: (sectionId: AiSearchSectionId, level: number) => OfferData | null;
  onStartDemo: (sectionId: AiSearchSectionId, sectionName: string, level: number) => void;
  onViewDetails: (sectionId: AiSearchSectionId, sectionName: string, level: number) => void;
}

interface OfferCardData extends OfferData {
  badge?: "best-fit" | "add-on" | "also-worth" | "popular";
  reason?: string;
}

// All chips start with "Shankara," so visitors feel they're addressing the AI.
// Kept short — 4 chips fit two lines without feeling cluttered.
const QUICK_CHIPS = [
  "Shankara, I run a cafe",
  "Shankara, I sell handmade items online",
  "Shankara, I want marketing only",
  "Shankara, I run a clinic",
];

const fmtPrice = (n: number): string => "₹" + n.toLocaleString("en-IN");

const BADGE_LABEL: Record<NonNullable<OfferCardData["badge"]>, string> = {
  "best-fit": "Best fit",
  "add-on": "Pair with",
  "also-worth": "Also worth a look",
  popular: "Popular start",
};

function OfferCard({
  card,
  onStartDemo,
  onViewDetails,
}: {
  card: OfferCardData;
  onStartDemo: AiSearchProps["onStartDemo"];
  onViewDetails: AiSearchProps["onViewDetails"];
}) {
  return (
    <article className={`offer-card offer-card-${card.badge ?? "default"}`}>
      {card.badge && (
        <span className={`offer-badge offer-badge-${card.badge}`}>{BADGE_LABEL[card.badge]}</span>
      )}
      <div className="offer-section">{card.sectionName}</div>
      <h3 className="offer-name">{card.name}</h3>
      <p className="offer-tagline">{card.tagline}</p>
      {card.reason && <p className="offer-reason">“{card.reason}”</p>}
      <div className="offer-price">
        {fmtPrice(card.price)}
        <span className="sc-price-period">/mo</span>
      </div>
      <div className="offer-actions">
        <button
          type="button"
          className="btn-fill offer-action-primary"
          onClick={() => onStartDemo(card.sectionId, card.sectionName, card.level)}
        >
          Get free demo
        </button>
        <button
          type="button"
          className="offer-action-secondary"
          onClick={() => onViewDetails(card.sectionId, card.sectionName, card.level)}
        >
          Details
        </button>
      </div>
    </article>
  );
}

export function AiSearch({ lookupPackage, onStartDemo, onViewDetails }: AiSearchProps) {
  const [query, setQuery] = useState("");
  const [advisor, setAdvisor] = useState<string | null>(null);
  const [results, setResults] = useState<AiSearchResult["ranked"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || pending) return;
      setError(null);
      setHasSearched(true);
      try {
        const raw = await aiSearchFn({ data: { query: trimmed } });
        const parsed = parseSearchResult(raw);
        startTransition(() => {
          setAdvisor(parsed.advisor);
          setResults(parsed.ranked);
        });
      } catch (e) {
        setError(
          e instanceof Error
            ? `Couldn't get suggestions — ${e.message}`
            : "Couldn't get suggestions",
        );
      }
    },
    [pending],
  );

  // Default starter cards when no search yet.
  const defaultStarters: Array<{ sectionId: AiSearchSectionId; level: number; reason: string }> = [
    { sectionId: "dp", level: 1, reason: "Clean 3-page site, get online fast." },
    { sectionId: "dp", level: 3, reason: "AI chat handles customer questions 24/7." },
    { sectionId: "dm", level: 1, reason: "Show up consistently on social." },
  ];
  const defaultCards: OfferCardData[] = defaultStarters.flatMap((d) => {
    const p = lookupPackage(d.sectionId, d.level);
    if (!p) return [];
    const card: OfferCardData = { ...p, badge: "popular", reason: d.reason };
    return [card];
  });

  const aiCards: OfferCardData[] = results.flatMap((r) => {
    const p = lookupPackage(r.sectionId, r.level);
    if (!p) return [];
    const card: OfferCardData = { ...p, badge: r.badge, reason: r.reason };
    return [card];
  });

  const displayCards = aiCards.length > 0 ? aiCards : defaultCards;
  const showingDefaults = aiCards.length === 0;

  return (
    <section id="packages" className="ai-search-section">
      <div className="ai-search-inner">
        <div className="ai-search-head">
          <span className="section-tag">Find your fit</span>
          <h2 className="section-headline">
            Tell us what you do. We'll show you what fits.
          </h2>
          <p className="section-sub mx-auto">
            Powered by Shankara AI. Describe your business in one line — get a personalised
            package recommendation.
          </p>
        </div>

        <form
          className="ai-search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query);
          }}
        >
          <input
            type="text"
            className="ai-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Shankara, I run a small boutique in Bangalore and want orders online…"
            maxLength={500}
            aria-label="Describe your business to Shankara"
          />
          <button
            type="submit"
            className="ai-search-run"
            disabled={pending || !query.trim()}
            aria-label="Run search"
          >
            {pending ? (
              <span className="ai-search-run-spin" aria-hidden="true" />
            ) : (
              "RUN"
            )}
          </button>
        </form>

        <div className="ai-search-chips">
          <span className="ai-search-chips-label">Or try:</span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="ai-search-chip"
              disabled={pending}
              onClick={() => {
                setQuery(chip);
                void runSearch(chip);
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {error && <div className="ai-search-error">{error}</div>}

        {advisor && (
          <div className="ai-search-advisor">
            <span className="ai-search-advisor-avatar" aria-hidden="true">
              S
            </span>
            <p>{advisor}</p>
          </div>
        )}

        {showingDefaults && !hasSearched && (
          <p className="ai-search-defaults-note">
            Popular starting points — or search above for a recommendation tailored to you.
          </p>
        )}

        <div className="ai-search-results">
          {pending && aiCards.length === 0
            ? // Skeleton state on first search
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="offer-card offer-card-skeleton" aria-hidden="true">
                  <div className="offer-skeleton-line offer-skeleton-line-sm" />
                  <div className="offer-skeleton-line offer-skeleton-line-lg" />
                  <div className="offer-skeleton-line offer-skeleton-line-md" />
                  <div className="offer-skeleton-line offer-skeleton-line-sm" />
                </div>
              ))
            : displayCards.map((card) => (
                <OfferCard
                  key={`${card.sectionId}-${card.level}`}
                  card={card}
                  onStartDemo={onStartDemo}
                  onViewDetails={onViewDetails}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
