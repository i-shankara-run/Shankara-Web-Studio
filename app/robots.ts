import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/api/", "/demo/confirmation"] },
    ],
    sitemap: "https://shankara.run/sitemap.xml",
  };
}
