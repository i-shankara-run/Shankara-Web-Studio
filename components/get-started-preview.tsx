"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRAND_PALETTE, shadeHex } from "@/lib/colors";
import { composeBusinessName } from "@/lib/compose-name";

const SHADE_DELTAS = [-0.18, 0, 0.2] as const;
const E164 = /^\+[1-9]\d{7,14}$/;

interface PreviewRun {
  leadId: string;
  slogan: string;
  fontDisplay: string;
  fontBody: string;
  accent: string;
  runsRemaining: number;
}

function loadGoogleFont(display: string, body: string) {
  if (typeof document === "undefined") return;
  const id = `gf-${display}-${body}`.replace(/\s+/g, "_");
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const fams = [
    `family=${display.replace(/\s+/g, "+")}:wght@500;700;800`,
    `family=${body.replace(/\s+/g, "+")}:wght@400;500`,
  ].join("&");
  link.href = `https://fonts.googleapis.com/css2?${fams}&display=swap`;
  document.head.appendChild(link);
}

function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--tx", `${-y * 10}deg`);
      el.style.setProperty("--ty", `${x * 14}deg`);
    };
    const onLeave = () => {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);
}

export function GetStartedPreview() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [colorIdx, setColorIdx] = useState<number | null>(null);
  const [shadeIdx, setShadeIdx] = useState(1); // 0 dark, 1 base, 2 light
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewRun | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [waInput, setWaInput] = useState("+91");
  const [submitting, setSubmitting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  useTilt(cardRef);

  const baseColor = colorIdx !== null ? BRAND_PALETTE[colorIdx]!.hex : "#3E6E9E";
  const shadedColor = useMemo(
    () => shadeHex(baseColor, SHADE_DELTAS[shadeIdx]!),
    [baseColor, shadeIdx],
  );

  const composed = useMemo(() => composeBusinessName(name || "Your Business"), [name]);

  useEffect(() => {
    if (result) loadGoogleFont(result.fontDisplay, result.fontBody);
  }, [result]);

  const canRun = name.trim().length >= 1 && desc.trim().length >= 2 && colorIdx !== null && !running;

  const parseJsonSafe = useCallback(async (r: Response): Promise<Record<string, unknown> | null> => {
    const txt = await r.text();
    if (!txt) return null;
    try { return JSON.parse(txt) as Record<string, unknown>; } catch { return null; }
  }, []);

  const onRun = useCallback(async () => {
    if (!canRun) return;
    setError(null);
    setRunning(true);
    setFlipped(false);
    try {
      const r = await fetch("/api/preview/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: name.trim(),
          businessDescription: desc.trim(),
          brandColor: baseColor.toUpperCase(),
          brandShade: shadedColor.toUpperCase(),
          leadId: result?.leadId,
        }),
      });
      const data = await parseJsonSafe(r);
      if (!r.ok) {
        if (r.status === 429) setGateOpen(true);
        const msg = typeof data?.error === "string"
          ? data.error
          : `Generation failed (HTTP ${r.status}). Please try again.`;
        setError(msg);
        return;
      }
      if (!data) {
        setError("Generator returned an empty response. Please try again.");
        return;
      }
      setResult(data as unknown as PreviewRun);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, [canRun, name, desc, baseColor, shadedColor, result?.leadId, parseJsonSafe]);

  const onPromote = useCallback(async () => {
    if (!result) return;
    if (!E164.test(waInput.trim())) {
      setError("WhatsApp must be in international format like +919876543210.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/preview/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: result.leadId, whatsappE164: waInput.trim() }),
      });
      const data = await parseJsonSafe(r);
      if (!r.ok) {
        const msg = typeof data?.error === "string"
          ? data.error
          : `Couldn't save right now (HTTP ${r.status}). Please try again.`;
        setError(msg);
        return;
      }
      // Soft-success case: API returned 200 with saved=false (DB down)
      if (data?.saved === false && typeof data?.warning === "string") {
        setError(data.warning as string);
        return;
      }
      setGateOpen(false);
      setFlipped(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }, [result, waInput, parseJsonSafe]);

  return (
    <div className="gsp-wrap">
      <div className="gsp-inputs">
        <label className="gsp-field gsp-field--name">
          <span className="gsp-label">Business name</span>
          <input
            type="text"
            placeholder="e.g. Anjali's Handmade Stationery Boutique"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </label>
        <label className="gsp-field gsp-field--desc">
          <span className="gsp-label">What you do</span>
          <input
            type="text"
            placeholder="e.g. handmade paper goods & cards"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={200}
          />
        </label>
        <div className="gsp-field gsp-field--color">
          <span className="gsp-label">Brand color</span>
          <div className="gsp-chips">
            {BRAND_PALETTE.map((c, i) => (
              <button
                key={c.hex}
                type="button"
                aria-label={`Pick color ${i + 1}`}
                className={`gsp-chip${colorIdx === i ? " gsp-chip--active" : ""}`}
                style={{ background: c.hex }}
                onClick={() => { setColorIdx(i); setShadeIdx(1); }}
              />
            ))}
          </div>
          {colorIdx !== null && (
            <div className="gsp-shades">
              {SHADE_DELTAS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Shade ${i + 1}`}
                  className={`gsp-shade${shadeIdx === i ? " gsp-shade--active" : ""}`}
                  style={{ background: shadeHex(baseColor, d) }}
                  onClick={() => setShadeIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="gsp-run"
          disabled={!canRun}
          onClick={onRun}
        >
          {running ? "Generating…" : result ? "Re-roll" : "Run"}
          <span className="gsp-run-arrow" aria-hidden>→</span>
        </button>
      </div>

      {error && <p className="gsp-error">{error}</p>}

      <div
        className={`gsp-stage${result ? " gsp-stage--ready" : ""}${flipped ? " gsp-stage--flipped" : ""}`}
        aria-live="polite"
      >
        <div
          ref={cardRef}
          className="gsp-card"
          onClick={() => result && setFlipped((f) => !f)}
          style={{
            ["--brand" as string]: shadedColor,
            ["--brand-soft" as string]: shadeHex(shadedColor, 0.32),
            ["--brand-deep" as string]: shadeHex(shadedColor, -0.18),
            ["--font-display" as string]: result ? `"${result.fontDisplay}", "Raleway", sans-serif` : '"Raleway", sans-serif',
            ["--font-body" as string]: result ? `"${result.fontBody}", "Lato", sans-serif` : '"Lato", sans-serif',
          }}
        >
          <div className="gsp-card-inner">
            <article className="gsp-face gsp-face--front">
              <div className="gsp-logo-slot" aria-hidden>
                <span>Your logo</span>
              </div>
              {composed.particle && <p className="gsp-particle">{composed.particle}</p>}
              {composed.modifiers && <p className="gsp-modifiers">{composed.modifiers}</p>}
              <h3 className="gsp-hero">{composed.hero || "BUSINESS"}</h3>
              <p className="gsp-slogan">
                {result?.accent && <span className="gsp-accent">{result.accent}</span>}
                {result?.slogan ?? "Your tagline appears here."}
                {result?.accent && <span className="gsp-accent">{result.accent}</span>}
              </p>
            </article>
            <article className="gsp-face gsp-face--back">
              <p className="gsp-back-label">Get in touch</p>
              <ul className="gsp-contact">
                <li><span>WhatsApp</span><em>+91 · · · · · · · · · ·</em></li>
                <li><span>Email</span><em>hello@yourbrand.in</em></li>
                <li><span>Instagram</span><em>@yourbrand</em></li>
                <li><span>Location</span><em>Your city, India</em></li>
              </ul>
              {result && (
                <p className="gsp-set-in">
                  Set in <strong>{result.fontDisplay}</strong> &amp; {result.fontBody}
                </p>
              )}
            </article>
          </div>
        </div>

        {result && (
          <div className="gsp-actions">
            <p className="gsp-hint">
              {flipped ? "Tap the card to flip back." : "Tap the card to see the back."}
              {result.runsRemaining > 0
                ? ` · ${result.runsRemaining} free re-roll${result.runsRemaining === 1 ? "" : "s"} left.`
                : " · Drop your WhatsApp to keep generating."}
            </p>
            <button
              type="button"
              className="gsp-cta"
              onClick={() => setGateOpen(true)}
            >
              Get my demo →
            </button>
          </div>
        )}
      </div>

      {gateOpen && (
        <div className="gsp-gate" role="dialog" aria-modal="true" aria-label="Get your demo">
          <div className="gsp-gate-card">
            <button
              type="button"
              className="gsp-gate-close"
              aria-label="Close"
              onClick={() => setGateOpen(false)}
            >×</button>
            <h4>Drop your WhatsApp</h4>
            <p>We'll research <strong>{name || "your business"}</strong> and send a real demo to your phone in 24 hours. We'll also keep your slogan, fonts and colours from this preview — none of this work goes to waste.</p>
            <input
              type="tel"
              inputMode="tel"
              value={waInput}
              onChange={(e) => setWaInput(e.target.value)}
              placeholder="+919876543210"
            />
            {error && <p className="gsp-error">{error}</p>}
            <button
              type="button"
              className="gsp-cta"
              onClick={onPromote}
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send my demo"}
            </button>
            <p className="gsp-fine">By submitting you agree to be contacted on WhatsApp.</p>
          </div>
        </div>
      )}
    </div>
  );
}
