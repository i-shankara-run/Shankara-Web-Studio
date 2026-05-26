export const BUSINESS_WHATSAPP_E164 = "+919080389091";
export const BUSINESS_WHATSAPP_DISPLAY = "+91 90803 89091";
export const BUSINESS_EMAIL = "hello@shankara.in";

export const businessWaLink = (prefilledText?: string): string => {
  const num = BUSINESS_WHATSAPP_E164.replace(/^\+/, "");
  const text = prefilledText ? `?text=${encodeURIComponent(prefilledText)}` : "";
  return `https://wa.me/${num}${text}`;
};
