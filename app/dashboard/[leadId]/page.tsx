import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { type LeadRow } from "@/lib/schemas";
import { LeadDetailEditor } from "./editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getLead(id: string): Promise<LeadRow | null> {
  return queryOne<LeadRow>(`select * from leads where id = $1`, [id]);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const lead = await getLead(leadId);
  if (!lead) notFound();

  return (
    <div className="dashboard-shell">
      <div className="dashboard-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/dashboard" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            ← All leads
          </Link>
          <span className={`dashboard-status dashboard-status-${lead.status}`}>
            {lead.status.replace(/_/g, " ")}
          </span>
        </div>
        <header>
          <h1 style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 700, fontSize: "1.6rem", margin: 0 }}>
            {lead.business_name}
          </h1>
          <p style={{ opacity: 0.7, margin: "0.25rem 0 0" }}>{lead.business_desc}</p>
        </header>

        <LeadDetailEditor initialLead={lead} />
      </div>
    </div>
  );
}
