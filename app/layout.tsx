import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shankara.run"),
  title: {
    default: "Shankara · run — Your business deserves to be online",
    template: "%s · Shankara · run",
  },
  description:
    "Custom AI agents for funded SaaS and D2C — shipped in 6 weeks, in your stack. Plus interactive websites and full-stack ops platforms with honest pricing and a one-year warranty.",
  keywords: [
    "AI development services",
    "AI development partner",
    "GenAI implementation partner",
    "LLM integration",
    "build AI agent for my business",
    "AI agent development",
    "custom AI agents",
    "Salesforce AI integration",
    "web design",
    "small business website",
    "Shankara",
  ],
  authors: [{ name: "Shankara · run" }],
  openGraph: {
    title: "Shankara · run — Custom AI agents in 6 weeks. From your stack, in your stack.",
    description:
      "Ship an AI agent in 6 weeks. Founder-led, your data never leaves your VPC. For funded SaaS, D2C and modern teams.",
    type: "website",
    locale: "en_IN",
    siteName: "Shankara · run",
  },
  twitter: {
    card: "summary_large_image",
    site: "@shankara_web",
  },
  icons: {
    icon: [
      { url: "/logo-on-blue.png", media: "(prefers-color-scheme: light)" },
      { url: "/logo-on-white.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/logo-on-blue.png",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* JSON-LD for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Shankara · run",
              url: "https://shankara.run",
              telephone: "+919080389091",
              email: "hello@shankara.in",
              areaServed: "IN",
              description:
                "AI engineering studio shipping custom AI agents into your stack in 6 weeks. Also builds websites and full-stack ops platforms for Indian businesses.",
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
