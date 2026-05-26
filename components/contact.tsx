"use client";

import { GetStartedPreview } from "./get-started-preview";

export function Contact({ onOpenChat: _onOpenChat }: { onOpenChat: () => void }) {
  return (
    <section id="contact" className="contact-section">
      <span className="section-tag">Get started</span>
      <h2 className="section-headline" style={{ maxWidth: 640, margin: "0 auto 0.75rem" }}>
        See your brand, before you build it.
      </h2>
      <p className="section-sub" style={{ maxWidth: 560, margin: "0 auto 2.5rem" }}>
        Type your business name, what you do, pick a colour. We'll generate a live brand card —
        slogan, fonts, accent — using the same studio that builds your real site.
      </p>
      <GetStartedPreview />
    </section>
  );
}
