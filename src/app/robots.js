export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/*", "/dashboard/*", "/chat/*"],
    },
    sitemap: "https://dms.falakgala.dev/sitemap.xml",
  };
}
