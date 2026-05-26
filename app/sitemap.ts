import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://shankara.run";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/demo/confirmation`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.1 },
  ];
}
