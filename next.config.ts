import type { NextConfig } from "next";

const config: NextConfig = {
  // Standalone output: writes the minimum runtime files into
  // .next/standalone — used by the Coolify Docker runtime image.
  output: "standalone",
  reactStrictMode: true,
  // The repo still carries TanStack-era ESLint rules (e.g. banning
  // `server-only` imports, strict prettier formatting on legacy /src files).
  // Don't gate the production build on them — runtime is unaffected.
  // Lint is still runnable manually with `bun run lint`.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ["libphonenumber-js", "@anthropic-ai/sdk"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default config;
