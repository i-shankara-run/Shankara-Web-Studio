"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { ColorPalette } from "./color-palette";
import { PACKAGES, fmtPrice, type OfferData, type SectionId } from "@/lib/packages";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface AiChatContext {
  /** Original search query, if user came from a card on the search results */
  query?: string;
  /** Advisor message the AI gave for that query */
  advisor?: string;
  /** Package the user chose to demo */
  selectedPackage?: OfferData;
  /** Dashboard prompt pre-generated from the search */
  dashboardPrompt?: string;
}

interface AiChatProps {
  context: AiChatContext;
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

function pickAssistantText(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join(" ");
}

function extractChips(content: ChatMessage["content"]): string[] | null {
  if (typeof content === "string") return null;
  for (const b of content) {
    if (b.type === "tool_use" && b.name === "show_chips") {
      const arr = b.input?.chips;
      if (Array.isArray(arr)) return arr.filter((c): c is string => typeof c === "string");
    }
  }
  return null;
}

function extractBenefits(content: ChatMessage["content"]): string[] | null {
  if (typeof content === "string") return null;
  for (const b of content) {
    if (b.type === "tool_use" && b.name === "show_benefits") {
      const arr = b.input?.bullets;
      if (Array.isArray(arr)) return arr.filter((c): c is string => typeof c === "string");
    }
  }
  return null;
}

interface RecommendationData {
  sectionId: SectionId;
  level: 1 | 2 | 3;
  why: string;
}
function extractRecommendation(content: ChatMessage["content"]): RecommendationData | null {
  if (typeof content === "string") return null;
  for (const b of content) {
    if (b.type === "tool_use" && b.name === "recommend_package") {
      const i = b.input;
      const sectionId = i?.sectionId;
      const level = i?.level;
      const why = i?.why;
      if (
        (sectionId === "dp" || sectionId === "fc" || sectionId === "dm") &&
        (level === 1 || level === 2 || level === 3) &&
        typeof why === "string"
      ) {
        return { sectionId, level, why };
      }
    }
  }
  return null;
}

function pendingTool(content: ChatMessage["content"]):
  | { id: string; name: string; input: Record<string, unknown> }
  | null {
  if (typeof content === "string") return null;
  for (const b of content) {
    if (b.type === "tool_use") return { id: b.id, name: b.name, input: b.input };
  }
  return null;
}

function RecommendationCard({
  data,
  onGetDemo,
}: {
  data: RecommendationData;
  onGetDemo: () => void;
}) {
  const router = useRouter();
  const section = PACKAGES[data.sectionId];
  const lv = section.levels.find((l) => l.level === data.level);
  if (!lv) return null;
  const top3 = lv.includes.slice(0, 3);
  return (
    <div className="ai-rec">
      <div className="ai-rec-top">
        <span className="ai-rec-badge">{section.icon} {section.section} · L{lv.level}</span>
        <h4 className="ai-rec-name">{lv.name}</h4>
        <p className="ai-rec-why">{data.why}</p>
      </div>
      <div className="ai-rec-price">
        {fmtPrice(lv.price)}
        <span>{lv.priceModel === "one-time" ? " one-time" : "/mo"}</span>
      </div>
      <ul className="ai-rec-list">
        {top3.map((it) => <li key={it}>{it}</li>)}
      </ul>
      <div className="ai-rec-cta">
        <button
          type="button"
          className="ai-rec-cta-secondary"
          onClick={() => router.push(`/details/${data.sectionId}/${data.level}`)}
        >
          View package details
        </button>
        <button
          type="button"
          className="ai-rec-cta-primary"
          onClick={onGetDemo}
        >
          Get my free demo
        </button>
      </div>
    </div>
  );
}

function customerOpener(ctx: AiChatContext): string {
  if (ctx.selectedPackage && ctx.query) {
    return `Shankara, I'm trying to: ${ctx.query.replace(/^Shankara,?\s*/i, "")}. I'd like a free demo for the ${ctx.selectedPackage.name} package. Can you get me one?`;
  }
  if (ctx.selectedPackage) {
    return `Shankara, can you get me a free demo of the ${ctx.selectedPackage.name} package?`;
  }
  if (ctx.query) {
    return ctx.query;
  }
  return "Shankara, I'd like a free demo for my business. Can you help me?";
}

// Persist chat per-package so re-opening shows the prior conversation.
const STORAGE_PREFIX = "shankara_chat_v1";
function storageKey(ctx: AiChatContext): string {
  const pkgKey = ctx.selectedPackage
    ? `${ctx.selectedPackage.sectionId}-${ctx.selectedPackage.level}`
    : "blank";
  return `${STORAGE_PREFIX}:${pkgKey}`;
}

interface PersistedState {
  messages: ChatMessage[];
  businessName: string;
  pickedColor: string | null;
  pickedShade: string | null;
  submittedLeadId: string | null;
}

function readPersisted(key: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function AiChat({ context, onClose }: AiChatProps) {
  const opener = useMemo(() => customerOpener(context), [context]);
  const storeKey = useMemo(() => storageKey(context), [context]);
  const persisted = useMemo(() => readPersisted(storeKey), [storeKey]);

  const [messages, setMessages] = useState<ChatMessage[]>(
    persisted?.messages ?? [{ role: "user", content: opener }],
  );
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(
    persisted?.submittedLeadId ?? null,
  );

  const [country, setCountry] = useState<CountryCode>("IN");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [pickedColor, setPickedColor] = useState<string | null>(persisted?.pickedColor ?? null);
  const [pickedShade, setPickedShade] = useState<string | null>(persisted?.pickedShade ?? null);
  const [businessName, setBusinessName] = useState<string>(persisted?.businessName ?? "");
  const [bizName, setBizName] = useState("");
  const [bizDesc, setBizDesc] = useState("");

  // Persist state on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const state: PersistedState = { messages, businessName, pickedColor, pickedShade, submittedLeadId };
    try {
      window.localStorage.setItem(storeKey, JSON.stringify(state));
    } catch {
      /* quota or privacy mode — silently skip */
    }
  }, [storeKey, messages, businessName, pickedColor, pickedShade, submittedLeadId]);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);
  const activeTool = lastAssistant ? pendingTool(lastAssistant.content) : null;

  const submitLead = useCallback(
    async (toolInput: Record<string, unknown>) => {
      try {
        const body = {
          businessName: String(toolInput.businessName ?? businessName ?? "").trim(),
          businessDescription: String(toolInput.businessDescription ?? context.query ?? "").trim(),
          whatsappE164: String(toolInput.whatsappE164 ?? "").trim(),
          brandColor: String(toolInput.brandColor ?? pickedColor ?? ""),
          brandShade: String(toolInput.brandShade ?? pickedShade ?? toolInput.brandColor ?? ""),
          packages: context.selectedPackage ? [context.selectedPackage] : [],
          consent: true,
          searchContext: context.query ?? null,
          dashboardPrompt: context.dashboardPrompt ?? null,
        };
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const e = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(e.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as { id: string };
        setSubmittedLeadId(json.id);
        return { ok: true, id: json.id };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    [businessName, context, pickedColor, pickedShade],
  );

  const callAi = useCallback(
    async (history: ChatMessage[]): Promise<void> => {
      setThinking(true);
      setError(null);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history,
            context: {
              businessDescription: context.query,
              selectedPackage: context.selectedPackage,
            },
          }),
        });
        if (!res.ok) {
          const e = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(e.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { stopReason: string | null; content: ContentBlock[] };
        const aiMsg: ChatMessage = { role: "assistant", content: data.content };
        const next = [...history, aiMsg];
        setMessages(next);

        const tool = pendingTool(aiMsg.content);
        // show_chips, show_benefits, show_color_picker, show_phone_input,
        // request_business_details — all rendered inline by the UI, no auto-handling.
        if (tool?.name === "save_lead") {
          const r = await submitLead(tool.input);
          const result: ChatMessage = {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: tool.id,
                content: JSON.stringify(r),
              },
            ],
          };
          const after = [...next, result];
          setMessages(after);
          if (r.ok) {
            // Final ack from AI, then redirect
            await fetch("/api/chat", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ messages: after, context: {} }),
            })
              .then((r2) => r2.json() as Promise<{ content: ContentBlock[] }>)
              .then((d2) => {
                setMessages((m) => [...m, { role: "assistant", content: d2.content }]);
              })
              .catch(() => {});
            setTimeout(() => window.location.assign("/demo/confirmation"), 1500);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI request failed");
      } finally {
        setThinking(false);
      }
    },
    [context, submitLead],
  );

  // Kick off the AI on mount — but only if we DIDN'T hydrate from persisted state.
  // (Hydrated state already has the previous AI replies; calling again would dupe.)
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    // If we restored a prior conversation that already has an assistant reply, skip.
    const hasAssistantReply = messages.some((m) => m.role === "assistant");
    if (hasAssistantReply || submittedLeadId) return;
    void callAi(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Anthropic requires tool_results for any tool_uses in the prior assistant turn.
  // For passive tools (show_chips, show_benefits), we auto-ack so user can keep typing.
  function autoAckBlocks(last: ChatMessage | undefined): ContentBlock[] {
    if (!last || last.role !== "assistant" || typeof last.content === "string") return [];
    const acks: ContentBlock[] = [];
    for (const b of last.content) {
      if (
        b.type === "tool_use" &&
        (b.name === "show_chips" || b.name === "show_benefits" || b.name === "recommend_package")
      ) {
        acks.push({ type: "tool_result", tool_use_id: b.id, content: "ok" });
      }
    }
    return acks;
  }

  const sendText = useCallback(
    async (text: string) => {
      const t = text.trim();
      // Allow text/chip click as long as there's no BLOCKING widget tool active.
      const blockingTool =
        activeTool &&
        activeTool.name !== "show_chips" &&
        activeTool.name !== "show_benefits" &&
        activeTool.name !== "recommend_package";
      if (!t || thinking || blockingTool || submittedLeadId) return;
      setInput("");
      const last = messages[messages.length - 1];
      const acks = autoAckBlocks(last);
      const userMsg: ChatMessage =
        acks.length > 0
          ? { role: "user", content: [...acks, { type: "text", text: t }] }
          : { role: "user", content: t };
      const next: ChatMessage[] = [...messages, userMsg];
      setMessages(next);
      await callAi(next);
    },
    [messages, thinking, activeTool, submittedLeadId, callAi],
  );

  const sendToolResult = useCallback(
    async (toolUseId: string, content: string) => {
      const next: ChatMessage[] = [
        ...messages,
        { role: "user", content: [{ type: "tool_result", tool_use_id: toolUseId, content }] },
      ];
      setMessages(next);
      await callAi(next);
    },
    [messages, callAi],
  );

  const phoneE164 = useMemo(() => {
    if (!phoneLocal.trim()) return null;
    const parsed = parsePhoneNumberFromString(phoneLocal.trim(), country);
    return parsed && parsed.isValid() ? parsed.number : null;
  }, [phoneLocal, country]);

  return (
    <div
      className="ai-chat-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Shankara"
      onClick={(e) => {
        // close when clicking backdrop, not card
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ai-chat-card">
        <div className="ai-chat-header">
          <div className="ai-chat-header-title">
            <span className="ai-chat-dot" />
            <div>
              <strong>Shankara</strong>
              <span className="ai-chat-status">{thinking ? "typing…" : "online"}</span>
            </div>
          </div>
          <button type="button" className="ai-chat-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {context.selectedPackage && (
          <div className="ai-chat-pkgs">
            <span className="ai-chat-pill">{context.selectedPackage.name}</span>
          </div>
        )}

        <div className="ai-chat-messages">
          {messages.map((m, i) => {
            const text = pickAssistantText(m.content);
            const benefits = m.role === "assistant" ? extractBenefits(m.content) : null;
            const chips = m.role === "assistant" ? extractChips(m.content) : null;
            const recommendation =
              m.role === "assistant" ? extractRecommendation(m.content) : null;
            if (!text && !benefits && !chips && !recommendation) return null;
            return (
              <div key={i} className="ai-chat-msg-group">
                {text && (
                  <div className={`ai-chat-bubble ai-chat-bubble-${m.role}`}>{text}</div>
                )}
                {recommendation && (
                  <RecommendationCard
                    data={recommendation}
                    onGetDemo={() => void sendText("Get my free demo")}
                  />
                )}
                {benefits && benefits.length > 0 && (
                  <ul className="ai-chat-benefits">
                    {benefits.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
                {chips && chips.length > 0 && (
                  <div className="ai-chat-chips">
                    {chips.map((c, j) => (
                      <button
                        key={j}
                        type="button"
                        className="ai-chat-chip"
                        disabled={thinking || !!submittedLeadId}
                        onClick={() => void sendText(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {thinking && (
            <div className="ai-chat-bubble ai-chat-bubble-assistant ai-chat-typing">
              <span></span><span></span><span></span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {activeTool?.name === "request_business_details" && !thinking && (
          <div className="ai-chat-widget">
            <label className="demo-form-field">
              <span className="demo-form-label">Business name</span>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="e.g. Sunrise Cafe"
                maxLength={120}
                autoFocus
                style={{ padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid rgba(62,110,158,0.2)", width: "100%", fontSize: "0.95rem" }}
              />
            </label>
            <label className="demo-form-field">
              <span className="demo-form-label">Business details (one line)</span>
              <textarea
                value={bizDesc}
                onChange={(e) => setBizDesc(e.target.value)}
                placeholder="e.g. small cafe near IIT Madras, sell coffee + filter snacks"
                maxLength={400}
                rows={2}
                style={{ padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid rgba(62,110,158,0.2)", width: "100%", fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical" }}
              />
            </label>
            <p style={{ fontSize: "0.78rem", opacity: 0.65, margin: 0 }}>
              We&apos;ll research your business online to build a tailored demo.
            </p>
            <button
              type="button"
              className="offer-action-primary ai-chat-widget-btn"
              disabled={bizName.trim().length < 2 || bizDesc.trim().length < 2}
              onClick={() => {
                setBusinessName(bizName.trim());
                void sendToolResult(
                  activeTool.id,
                  `User shared businessName="${bizName.trim()}" businessDescription="${bizDesc.trim()}"`,
                );
              }}
            >
              Send
            </button>
          </div>
        )}

        {activeTool?.name === "show_color_picker" && !thinking && (
          <div className="ai-chat-widget">
            <ColorPalette
              selectedColor={pickedColor}
              selectedShade={pickedShade}
              onSelect={(c, s) => { setPickedColor(c); setPickedShade(s); }}
            />
            <button
              type="button"
              className="offer-action-primary ai-chat-widget-btn"
              disabled={!pickedColor || !pickedShade}
              onClick={() => {
                if (!pickedColor || !pickedShade) return;
                void sendToolResult(activeTool.id, `User picked brandColor=${pickedColor} brandShade=${pickedShade}`);
              }}
            >
              Use this color
            </button>
          </div>
        )}

        {activeTool?.name === "show_phone_input" && !thinking && (
          <div className="ai-chat-widget">
            <div className="ai-chat-phone-row">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
                aria-label="Country code"
                style={{ padding: "0.6rem", borderRadius: 8, border: "1px solid rgba(62,110,158,0.2)" }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.dial} · {c.label}</option>
                ))}
              </select>
              <input
                type="tel"
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value)}
                placeholder="98765 43210"
                inputMode="tel"
                autoComplete="tel"
                style={{ padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid rgba(62,110,158,0.2)" }}
              />
            </div>
            {phoneLocal && !phoneE164 && (
              <span style={{ fontSize: "0.76rem", color: "#C8102E" }}>
                Doesn't look right — check the country code.
              </span>
            )}
            <button
              type="button"
              className="offer-action-primary ai-chat-widget-btn"
              disabled={!phoneE164}
              onClick={() => void sendToolResult(activeTool.id, `User entered whatsappE164=${phoneE164}`)}
            >
              Send
            </button>
          </div>
        )}

        {error && <div className="ai-chat-error">{error}</div>}

        {(!activeTool || activeTool.name === "show_chips" || activeTool.name === "show_benefits" || activeTool.name === "recommend_package") && !submittedLeadId && (
          <div className="ai-chat-input-bar">
            <input
              className="ai-chat-input"
              placeholder="Type your reply…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void sendText(input); }}
              disabled={thinking}
              autoFocus
            />
            <button
              type="button"
              className="ai-chat-send"
              onClick={() => void sendText(input)}
              disabled={!input.trim() || thinking}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </div>
        )}

        {submittedLeadId && (
          <div className="ai-chat-finished">Saved. Taking you to the confirmation page…</div>
        )}
      </div>
    </div>
  );
}
