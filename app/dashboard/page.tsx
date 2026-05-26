import Link from "next/link";
import { query } from "@/lib/db";
import { type LeadRow } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Leads · Dashboard" };

async function getLeads(): Promise<LeadRow[]> {
  return query<LeadRow>(`select * from leads order by created_at desc limit 200`);
}

export default async function DashboardListPage() {
  const leads = await getLeads();
  return (
    <div className="dashboard-shell">
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>Leads</h1>
            <p className="dashboard-header-sub">{leads.length} total</p>
          </div>
          <form action="/api/dashboard/logout" method="post">
            <button type="submit" className="offer-action-secondary">Sign out</button>
          </form>
        </header>

        {leads.length === 0 ? (
          <div className="dashboard-empty">No leads yet. The first form submission will land here.</div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Business</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="dashboard-td-meta">
                    {new Date(l.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td>
                    <div className="dashboard-td-name">{l.business_name}</div>
                    <div className="dashboard-td-meta">{l.business_desc}</div>
                  </td>
                  <td className="dashboard-td-meta">{l.whatsapp_e164}</td>
                  <td>
                    <span className={`dashboard-status dashboard-status-${l.status}`}>
                      {l.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/${l.id}`} className="offer-action-secondary">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
