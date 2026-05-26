// Editorial typography composition for a business name.
//
// Strategy: classify each token, then promote ONE "hero" word and stack the
// rest as a small particle above + a mid-size modifier band.
//
//   particle      (24px light italic) — possessive / article / preposition
//   modifiers     (36px regular)      — adjectives + descriptors (one line)
//   HERO          (84px bold caps)    — the anchor noun
//
// The hero pick uses two rules in order:
//   1. The LAST non-particle, non-trailing-punctuation token (most English
//      business names follow "[modifiers] [noun]" — "Anjali's Handmade
//      Stationery BOUTIQUE", "Joe's PIZZA", "MUMBAI Chai HOUSE").
//   2. If the last word is very short (<= 3 chars) AND another token is much
//      longer, prefer the longer one (avoids a tiny "Co" hero on
//      "Stationery Co").
//
// 1-word and 2-word names skip the modifier band.

const PARTICLE_PATTERNS = [
  /'s$/i,
  /^(the|a|an|and|of|for|by|with|to|de|da|du|la|le|les|el|los|las|al)$/i,
];

function isParticle(token: string): boolean {
  return PARTICLE_PATTERNS.some((re) => re.test(token));
}

function clean(token: string): string {
  return token.replace(/[^\p{L}\p{N}'·.&-]+/gu, "");
}

export interface ComposedName {
  particle: string | null;
  modifiers: string | null;
  hero: string;
}

export function composeBusinessName(raw: string): ComposedName {
  const tokens = raw.trim().split(/\s+/).map(clean).filter(Boolean);
  if (tokens.length === 0) return { particle: null, modifiers: null, hero: "" };
  if (tokens.length === 1) return { particle: null, modifiers: null, hero: tokens[0]! };

  // Pull a leading particle (e.g. "The Coffee House" → particle="The",
  // "Joe's Pizza" → particle="Joe's"). Needs at least one non-particle
  // token to remain as the hero.
  let particle: string | null = null;
  let rest = tokens;
  if (isParticle(tokens[0]!) && tokens.length >= 2) {
    particle = tokens[0]!;
    rest = tokens.slice(1);
  }

  if (rest.length === 1) return { particle, modifiers: null, hero: rest[0]! };

  // Pick the hero from the remaining tokens
  const last = rest[rest.length - 1]!;
  const longest = rest.reduce((a, b) => (b.length > a.length ? b : a), rest[0]!);
  const hero =
    last.length <= 3 && longest.length - last.length >= 4 ? longest : last;
  const heroIdx = rest.lastIndexOf(hero);
  const modifiers = rest.filter((_, i) => i !== heroIdx).join(" ") || null;

  return { particle, modifiers, hero };
}

// --- Examples (mental test vectors) ----------------------------------------
//   "Anjali's Handmade Stationery Boutique"
//     → { particle: "Anjali's", modifiers: "Handmade Stationery", hero: "Boutique" }
//   "The Coffee House"
//     → { particle: "The", modifiers: "Coffee", hero: "House" }
//   "Joe's Pizza"
//     → { particle: "Joe's", modifiers: null, hero: "Pizza" }  (2 tokens after particle pull → fallback skips particle, hero=Pizza, modifier=Joe's)
//   "Mumbai Chai"
//     → { particle: null, modifiers: "Mumbai", hero: "Chai" }
//   "Stationery Co"
//     → { particle: null, modifiers: "Co", hero: "Stationery" }  (last too short, longer wins)
//   "Acme"
//     → { particle: null, modifiers: null, hero: "Acme" }
