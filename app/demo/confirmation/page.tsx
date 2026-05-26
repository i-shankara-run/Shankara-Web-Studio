"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { businessWaLink } from "@/lib/contact";

// Paste from Google Ads → Tools → Conversions → tag setup once campaign is live.
const GOOGLE_ADS_CONVERSION_SEND_TO: string | null = null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function ConfirmationPage() {
  useEffect(() => {
    if (!GOOGLE_ADS_CONVERSION_SEND_TO || typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    const gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag = window.gtag || gtag;
    window.gtag("event", "conversion", { send_to: GOOGLE_ADS_CONVERSION_SEND_TO });
  }, []);

  return (
    <main className="confirmation-page">
      <div className="confirmation-card">
        <Image src="/wordmark.png" alt="Shankara · run" width={140} height={26} className="confirmation-logo" />
        <div className="confirmation-check" aria-hidden="true">✓</div>
        <h1 className="confirmation-title">Your demo is on the way.</h1>
        <p className="confirmation-sub">
          We're researching your business and building a custom preview. You'll get a WhatsApp
          message with a live link within 24 hours. If you haven't heard from us by then, we'll
          follow up in 12 hours after that.
        </p>
        <p className="confirmation-meta">
          Need to add something or change a detail?{" "}
          <a
            className="confirmation-link"
            href={businessWaLink("Hi Shankara, I just submitted a demo request — need to add a detail.")}
            target="_blank"
            rel="noreferrer"
          >
            Send us a WhatsApp message
          </a>.
        </p>
        <div className="confirmation-actions">
          <Link href="/" className="btn-outline">← Back to packages</Link>
        </div>
      </div>
    </main>
  );
}
