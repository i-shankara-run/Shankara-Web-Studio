import { useCallback, useMemo, useState } from "react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { ColorPalette } from "./ColorPalette";

export interface SelectedPackageRef {
  sectionId: "dp" | "fc" | "dm";
  level: number;
  name: string;
  price: number;
}

interface DemoFormProps {
  selectedPackages: SelectedPackageRef[];
  onClose: () => void;
}

const COUNTRIES: { code: CountryCode; dial: string; label: string }[] = [
  { code: "IN", dial: "+91", label: "India" },
  { code: "US", dial: "+1", label: "USA" },
  { code: "GB", dial: "+44", label: "UK" },
  { code: "AE", dial: "+971", label: "UAE" },
  { code: "SG", dial: "+65", label: "Singapore" },
  { code: "AU", dial: "+61", label: "Australia" },
];

export function DemoForm({ selectedPackages, onClose }: DemoFormProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  const [country, setCountry] = useState<CountryCode>("IN");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [brandShade, setBrandShade] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1Valid = businessName.trim().length >= 2 && businessDescription.trim().length >= 2;

  const phoneE164 = useMemo(() => {
    if (!phoneLocal.trim()) return null;
    const parsed = parsePhoneNumberFromString(phoneLocal.trim(), country);
    return parsed && parsed.isValid() ? parsed.number : null;
  }, [phoneLocal, country]);

  const step2Valid = !!phoneE164 && !!brandColor && !!brandShade && consent;

  const handleSubmit = useCallback(async () => {
    if (!step2Valid || !brandColor || !brandShade || !phoneE164) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/leads/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessDescription: businessDescription.trim(),
          whatsappE164: phoneE164,
          brandColor,
          brandShade,
          packages: selectedPackages,
          consent: true,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: unknown };
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : `Something went wrong (HTTP ${res.status}). Please try again.`,
        );
      }
      // Hard navigation so /demo/confirmation fires gtag conversion as a page load.
      window.location.assign("/demo/confirmation");
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Failed to submit");
    }
  }, [
    step2Valid,
    businessName,
    businessDescription,
    phoneE164,
    brandColor,
    brandShade,
    selectedPackages,
  ]);

  return (
    <div className="demo-form-overlay" role="dialog" aria-modal="true" aria-label="Get a free demo">
      <div className="demo-form-card">
        <div className="demo-form-header">
          <div className="demo-form-heading">
            <h2>Get your free demo</h2>
            <p>Two quick steps — under 30 seconds.</p>
          </div>
          <button type="button" className="demo-form-close" onClick={onClose} aria-label="Close">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {selectedPackages.length > 0 && (
          <div className="demo-form-packages">
            {selectedPackages.map((p) => (
              <span key={`${p.sectionId}-${p.level}`} className="demo-form-pill">
                {p.name}
              </span>
            ))}
          </div>
        )}

        <div className="demo-form-progress">
          <span className={`demo-form-dot${step >= 1 ? " demo-form-dot-active" : ""}`} />
          <span className={`demo-form-dot${step >= 2 ? " demo-form-dot-active" : ""}`} />
          <span className="demo-form-step-label">Step {step} of 2</span>
        </div>

        {step === 1 && (
          <div className="demo-form-step">
            <p className="demo-form-research-hint">
              ✨ Just the basics — our team will research your business online and craft a custom
              demo around what we find. You don't need to write much here.
            </p>

            <label className="demo-form-field">
              <span className="demo-form-label">Business name</span>
              <input
                className="demo-form-input"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Shankara Web Studio"
                maxLength={120}
                autoFocus
              />
            </label>

            <label className="demo-form-field">
              <span className="demo-form-label">One-line description</span>
              <textarea
                className="demo-form-input demo-form-textarea"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="e.g. boutique coffee roaster in Bangalore"
                maxLength={400}
                rows={3}
              />
              <span className="demo-form-hint">{businessDescription.length}/400</span>
            </label>

            <div className="demo-form-actions">
              <button
                type="button"
                className="btn-fill"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="demo-form-step">
            <label className="demo-form-field">
              <span className="demo-form-label">WhatsApp number</span>
              <div className="demo-form-phone-row">
                <select
                  className="demo-form-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value as CountryCode)}
                  aria-label="Country code"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.dial} · {c.label}
                    </option>
                  ))}
                </select>
                <input
                  className="demo-form-input"
                  type="tel"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  placeholder="98765 43210"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              {phoneLocal && !phoneE164 && (
                <span className="demo-form-error-inline">
                  Doesn't look like a valid number — check the country code and try again.
                </span>
              )}
            </label>

            <div className="demo-form-field">
              <span className="demo-form-label">Pick your brand color</span>
              <ColorPalette
                selectedColor={brandColor}
                selectedShade={brandShade}
                onSelect={(c, s) => {
                  setBrandColor(c);
                  setBrandShade(s);
                }}
              />
            </div>

            <label className="demo-form-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>I'm OK with Shankara contacting me on WhatsApp about my demo.</span>
            </label>

            {error && <div className="demo-form-error">{error}</div>}

            <div className="demo-form-actions">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn-fill"
                disabled={!step2Valid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Sending…" : "Send me my free demo"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
