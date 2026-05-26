"use client";

import { useState } from "react";
import { AiChat } from "@/components/ai-chat";
import { lookupPackage, type SectionId } from "@/lib/packages";

interface Props {
  sectionId: SectionId;
  level: number;
  packageName: string;
  price: number;
  tagline: string;
}

export function DetailsClient({ sectionId, level }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const pkg = lookupPackage(sectionId, level);

  return (
    <>
      <section className="details-cta">
        <h2 className="details-h2" style={{ textAlign: "center" }}>Ready when you are</h2>
        <p style={{ textAlign: "center", opacity: 0.7, margin: "0.5rem 0 1.25rem" }}>
          Free 24-hour demo prototype. No commitment.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="sc-cta-primary"
            onClick={() => setChatOpen(true)}
            style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem" }}
          >
            Get Free Demo
          </button>
        </div>
      </section>
      {chatOpen && pkg && (
        <AiChat context={{ selectedPackage: pkg }} onClose={() => setChatOpen(false)} />
      )}
    </>
  );
}
