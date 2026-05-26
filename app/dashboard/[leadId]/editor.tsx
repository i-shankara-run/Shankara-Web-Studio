"use client";

import { useState } from "react";
import { LEAD_STATUSES, type LeadRow, type LeadStatus } from "@/lib/schemas";

export function LeadDetailEditor({ initialLead }: { initialLead: LeadRow }) {
  const [lead, setLead] = useState<LeadRow>(initialLead);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [logoUrl, setLogoUrl] = useState(lead.logo_url ?? "");
  const [servicesNotes, setServicesNotes] = useState(lead.services_notes ?? "");
  const [onlineUrls, setOnlineUrls] = useState((lead.online_urls ?? []).join("\n"));
  const [researchNotes, setResearchNotes] = useState(lead.research_notes ?? "");
  const [demoUrl, setDemoUrl] = useState(lead.demo_url ?? "");
  const [subdomain, setSubdomain] = useState(lead.subdomain ?? "");

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = (await res.json()) as { lead: LeadRow };
      setLead(data.lead);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function copyPrompt() {
    if (!lead.generated_prompt) return;
    await navigator.clipboard.writeText(lead.generated_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {error && <div className="dashboard-login-error">{error}</div>}

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Lead</h2>
          <div style={{ display: "grid", gap: "0.7rem", fontSize: "0.9rem" }}>
            <div><strong>WhatsApp:</strong> {lead.whatsapp_e164}</div>
            <div>
              <strong>Brand color:</strong>{" "}
              <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: 999, background: lead.brand_color, verticalAlign: "middle" }} /> {lead.brand_color}{" "}
              <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: 999, background: lead.brand_shade, verticalAlign: "middle" }} /> {lead.brand_shade}
            </div>
            <div>
              <strong>Packages:</strong>{" "}
              {lead.packages?.length
                ? lead.packages.map((p) => `${p.name} (₹${p.price.toLocaleString("en-IN")})`).join(", ")
                : "—"}
            </div>
            {lead.search_context && (
              <div><strong>Search context:</strong> <em>"{lead.search_context}"</em></div>
            )}
            <div>
              <strong>WhatsApp send:</strong>{" "}
              {lead.wa_msg_id
                ? `sent · ${lead.wa_msg_id}`
                : lead.wa_error
                ? `error: ${lead.wa_error}`
                : "pending"}
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontFamily: '"Raleway"', fontWeight: 600, fontSize: "0.78rem" }}>Status</span>
              <select
                value={lead.status}
                onChange={(e) => void patch({ status: e.target.value as LeadStatus })}
                disabled={saving}
                style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid rgba(62,110,158,0.2)", textTransform: "capitalize" }}
              >
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="dashboard-card">
          <h2>Research &amp; enrichment</h2>
          <label className="dashboard-field">
            <span>Logo URL</span>
            <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
          </label>
          <label className="dashboard-field">
            <span>Services / offerings</span>
            <textarea rows={4} value={servicesNotes} onChange={(e) => setServicesNotes(e.target.value)} placeholder="What they sell, target customer, USP…" />
          </label>
          <label className="dashboard-field">
            <span>Online presence URLs (one per line)</span>
            <textarea rows={4} value={onlineUrls} onChange={(e) => setOnlineUrls(e.target.value)} placeholder="https://instagram.com/…" />
          </label>
          <label className="dashboard-field">
            <span>Research notes</span>
            <textarea rows={4} value={researchNotes} onChange={(e) => setResearchNotes(e.target.value)} placeholder="Tone, competitors, anything to feed the prompt" />
          </label>
          <button
            type="button"
            className="offer-action-primary"
            disabled={saving}
            style={{ alignSelf: "flex-end" }}
            onClick={() =>
              void patch({
                logoUrl: logoUrl.trim(),
                servicesNotes,
                onlineUrls: onlineUrls.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
                researchNotes,
              })
            }
          >
            {saving ? "Saving…" : "Save research"}
          </button>
        </section>
      </div>

      <section className="dashboard-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Generated prompt {lead.generated_prompt && <span style={{ fontSize: "0.7rem", opacity: 0.55, fontWeight: 400, marginLeft: 8 }}>(auto-prepared from customer's search)</span>}</h2>
          {lead.generated_prompt && (
            <button type="button" className="offer-action-secondary" onClick={copyPrompt}>
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          )}
        </div>
        {lead.generated_prompt ? (
          <pre className="dashboard-prompt">{lead.generated_prompt}</pre>
        ) : (
          <p style={{ opacity: 0.65, fontSize: "0.9rem" }}>
            No prompt yet. (This lead came in before the AI handoff was wired, or the AI call failed.)
          </p>
        )}
      </section>

      <section className="dashboard-card">
        <h2>Demo deployment</h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.65, margin: 0 }}>
          Paste the live demo URL + subdomain once you've shipped via Coolify.
        </p>
        <label className="dashboard-field">
          <span>Demo URL</span>
          <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://demo-acme.shankara.run" />
        </label>
        <label className="dashboard-field">
          <span>Subdomain</span>
          <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="demo-acme" />
        </label>
        <button
          type="button"
          className="offer-action-primary"
          disabled={saving}
          style={{ alignSelf: "flex-end" }}
          onClick={() => void patch({ demoUrl: demoUrl.trim(), subdomain: subdomain.trim() })}
        >
          {saving ? "Saving…" : "Save deployment"}
        </button>
      </section>
    </>
  );
}
