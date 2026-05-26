export interface WhatsAppSendResult {
  messageId?: string;
  error?: string;
}

export async function sendTemplate(
  phoneE164: string,
  businessName: string,
): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? "lead_confirmation_v1";

  if (!phoneNumberId || !token) {
    return { error: "WhatsApp not configured (missing env vars)" };
  }

  // Meta expects the number without leading "+"
  const to = phoneE164.replace(/^\+/, "");

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: businessName }],
        },
      ],
    },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { error: json?.error?.message ?? `WhatsApp HTTP ${res.status}` };
    }
    const id = json?.messages?.[0]?.id;
    return id ? { messageId: id } : { error: "No message id returned" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
