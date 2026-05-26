import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { aiChatFn, AI_INITIAL_GREETING, parseAiResponse } from "@/lib/ai-shankara";
import { ColorPalette } from "./ColorPalette";

export interface SelectedPackageRef {
  sectionId: "dp" | "fc" | "dm";
  level: number;
  name: string;
  price: number;
}

interface AiChatProps {
  selectedPackages: SelectedPackageRef[];
  onClose: () => void;
}

// ── Conversation types matching Anthropic's message shape ─────────
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
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

function pendingTool(content: ChatMessage["content"]):
  | { id: string; name: string; input: Record<string, unknown> }
  | null {
  if (typeof content === "string") return null;
  for (const b of content) {
    if (b.type === "tool_use") return { id: b.id, name: b.name, input: b.input };
  }
  return null;
}

export function AiChat({ selectedPackages, onClose }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: AI_INITIAL_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  // Inline widget state
  const [country, setCountry] = useState<CountryCode>("IN");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [pickedShade, setPickedShade] = useState<string | null>(null);

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

  // Submit to lead-create endpoint when AI calls save_lead
  const submitLead = useCallback(
    async (toolInput: Record<string, unknown>, toolUseId: string) => {
      try {
        const body = {
          businessName: String(toolInput.businessName ?? "").trim(),
          businessDescription: String(toolInput.businessDescription ?? "").trim(),
          whatsappE164: String(toolInput.whatsappE164 ?? "").trim(),
          brandColor: String(toolInput.brandColor ?? ""),
          brandShade: String(toolInput.brandShade ?? toolInput.brandColor ?? ""),
          packages: selectedPackages,
          consent: true,
        };
        const res = await fetch("/leads/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: unknown };
          throw new Error(typeof errBody.error === "string" ? errBody.error : `HTTP ${res.status}`);
        }
        const json = (await res.json()) as { id: string };
        setSubmittedLeadId(json.id);
        // Send a tool_result so the AI can wrap up with a final message
        return { ok: true, message: `Lead saved (id: ${json.id})` };
      } catch (e) {
        return {
          ok: false,
          message: e instanceof Error ? e.message : "Failed to save lead",
        };
      }
    },
    [selectedPackages],
  );

  const callAi = useCallback(
    async (history: ChatMessage[]): Promise<void> => {
      setThinking(true);
      setError(null);
      try {
        const raw = await aiChatFn({ data: { messages: history } });
        const res = parseAiResponse(raw);
        const aiMsg: ChatMessage = {
          role: "assistant",
          content: res.content as ContentBlock[],
        };
        const next = [...history, aiMsg];
        setMessages(next);

        // Handle tool calls that need server-side action immediately (save_lead).
        const tool = pendingTool(aiMsg.content);
        if (tool?.name === "save_lead") {
          const result = await submitLead(tool.input, tool.id);
          const toolResult: ChatMessage = {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: tool.id,
                content: JSON.stringify(result),
              },
            ],
          };
          const after = [...next, toolResult];
          setMessages(after);
          if (result.ok) {
            // Final ack from AI, then navigate.
            const finalRaw = await aiChatFn({ data: { messages: after } });
            const finalRes = parseAiResponse(finalRaw);
            setMessages((m) => [
              ...m,
              { role: "assistant", content: finalRes.content as ContentBlock[] },
            ]);
            setTimeout(() => {
              window.location.assign("/demo/confirmation");
            }, 1500);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI request failed");
      } finally {
        setThinking(false);
      }
    },
    [submitLead],
  );

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking || activeTool || submittedLeadId) return;
      setInput("");
      const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      await callAi(next);
    },
    [messages, thinking, activeTool, submittedLeadId, callAi],
  );

  const sendToolResult = useCallback(
    async (toolUseId: string, content: string) => {
      const next: ChatMessage[] = [
        ...messages,
        {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: toolUseId, content }],
        },
      ];
      setMessages(next);
      await callAi(next);
    },
    [messages, callAi],
  );

  const confirmColor = useCallback(() => {
    if (!activeTool || !pickedColor || !pickedShade) return;
    void sendToolResult(
      activeTool.id,
      `User picked brandColor=${pickedColor} brandShade=${pickedShade}`,
    );
  }, [activeTool, pickedColor, pickedShade, sendToolResult]);

  const phoneE164 = useMemo(() => {
    if (!phoneLocal.trim()) return null;
    const parsed = parsePhoneNumberFromString(phoneLocal.trim(), country);
    return parsed && parsed.isValid() ? parsed.number : null;
  }, [phoneLocal, country]);

  const confirmPhone = useCallback(() => {
    if (!activeTool || !phoneE164) return;
    void sendToolResult(activeTool.id, `User entered whatsappE164=${phoneE164}`);
  }, [activeTool, phoneE164, sendToolResult]);

  return (
    <div
      className="ai-chat-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Shankara"
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
          <div className="ai-chat-pkgs">
            {selectedPackages.map((p) => (
              <span key={`${p.sectionId}-${p.level}`} className="ai-chat-pill">
                {p.name}
              </span>
            ))}
          </div>
        )}

        <div className="ai-chat-messages">
          {messages.map((m, i) => {
            const text = pickAssistantText(m.content);
            if (!text) return null; // skip tool_result messages
            return (
              <div key={i} className={`ai-chat-bubble ai-chat-bubble-${m.role}`}>
                {text}
              </div>
            );
          })}
          {thinking && (
            <div className="ai-chat-bubble ai-chat-bubble-assistant ai-chat-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Inline widget: color picker */}
        {activeTool?.name === "show_color_picker" && !thinking && (
          <div className="ai-chat-widget">
            <ColorPalette
              selectedColor={pickedColor}
              selectedShade={pickedShade}
              onSelect={(c, s) => {
                setPickedColor(c);
                setPickedShade(s);
              }}
            />
            <button
              type="button"
              className="btn-fill ai-chat-widget-btn"
              disabled={!pickedColor || !pickedShade}
              onClick={confirmColor}
            >
              Use this color
            </button>
          </div>
        )}

        {/* Inline widget: phone input */}
        {activeTool?.name === "show_phone_input" && !thinking && (
          <div className="ai-chat-widget">
            <div className="ai-chat-phone-row">
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
                Doesn't look right — check the country code.
              </span>
            )}
            <button
              type="button"
              className="btn-fill ai-chat-widget-btn"
              disabled={!phoneE164}
              onClick={confirmPhone}
            >
              Share my WhatsApp
            </button>
          </div>
        )}

        {error && <div className="ai-chat-error">{error}</div>}

        {/* Text input (hidden when a widget is up or after submit) */}
        {!activeTool && !submittedLeadId && (
          <div className="ai-chat-input-bar">
            <input
              className="ai-chat-input"
              placeholder="Type your reply…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendText(input);
              }}
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
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </div>
        )}

        {submittedLeadId && (
          <div className="ai-chat-finished">
            Saved. Taking you to the confirmation page…
          </div>
        )}
      </div>
    </div>
  );
}
