import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  isAuthenticated,
  checkPassword,
  issueSessionCookie,
  clearSessionCookie,
  requireAdmin,
} from "./auth";
import { query, queryOne } from "./db";
import { leadUpdateSchema, LEAD_STATUSES, type LeadRow } from "./schemas";
import { generatePrompt } from "./anthropic";

export const checkAuthFn = createServerFn({ method: "GET" }).handler(() => ({
  authenticated: isAuthenticated(),
}));

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1) }))
  .handler(({ data }) => {
    if (!checkPassword(data.password)) {
      throw new Error("Wrong password");
    }
    issueSessionCookie();
    return { ok: true as const };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(() => {
  clearSessionCookie();
  return { ok: true as const };
});

export const listLeadsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        status: z.enum(LEAD_STATUSES).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    requireAdmin();
    const status = data?.status;
    const rows = status
      ? await query<LeadRow>(
          `select * from leads where status = $1 order by created_at desc limit 200`,
          [status],
        )
      : await query<LeadRow>(`select * from leads order by created_at desc limit 200`);
    return { leads: rows };
  });

export const getLeadFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [data.id]);
    if (!lead) throw new Error("Lead not found");
    return { lead };
  });

export const updateLeadFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      patch: leadUpdateSchema,
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin();
    const p = data.patch;
    const fields: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, val: unknown) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };
    if (p.status !== undefined) push("status", p.status);
    if (p.logoUrl !== undefined) push("logo_url", p.logoUrl || null);
    if (p.servicesNotes !== undefined) push("services_notes", p.servicesNotes);
    if (p.onlineUrls !== undefined) push("online_urls", p.onlineUrls);
    if (p.researchNotes !== undefined) push("research_notes", p.researchNotes);
    if (p.demoUrl !== undefined) push("demo_url", p.demoUrl || null);
    if (p.subdomain !== undefined) push("subdomain", p.subdomain || null);

    if (fields.length === 0) {
      const lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [data.id]);
      return { lead: lead! };
    }
    values.push(data.id);
    const lead = await queryOne<LeadRow>(
      `update leads set ${fields.join(", ")} where id = $${values.length} returning *`,
      values,
    );
    if (!lead) throw new Error("Update failed");
    return { lead };
  });

export const generatePromptFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [data.id]);
    if (!lead) throw new Error("Lead not found");
    const prompt = await generatePrompt(lead);
    const updated = await queryOne<LeadRow>(
      `update leads set generated_prompt = $1, status = case when status = 'new' then 'prompt_generated'::lead_status when status = 'researching' then 'prompt_generated'::lead_status else status end where id = $2 returning *`,
      [prompt, data.id],
    );
    return { lead: updated! };
  });

export const resendWhatsAppFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const { sendTemplate } = await import("./whatsapp");
    const lead = await queryOne<LeadRow>(`select * from leads where id = $1`, [data.id]);
    if (!lead) throw new Error("Lead not found");
    const res = await sendTemplate(lead.whatsapp_e164, lead.business_name);
    if (res.messageId) {
      await query(`update leads set wa_msg_id = $1, wa_error = null where id = $2`, [
        res.messageId,
        data.id,
      ]);
      return { ok: true as const, messageId: res.messageId };
    }
    await query(`update leads set wa_error = $1 where id = $2`, [res.error ?? "Unknown", data.id]);
    throw new Error(res.error ?? "WhatsApp send failed");
  });
