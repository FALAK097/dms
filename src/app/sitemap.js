export default function sitemap() {
  return [
    {
      url: "https://dms.falakgala.dev",
      priority: 1,
      changeFrequency: "daily",
    },
    {
      url: "https://dms.falakgala.dev/dashboard",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      url: "https://dms.falakgala.dev/settings",
      priority: 0.8,
      changeFrequency: "daily",
    },
    {
      url: "https://dms.falakgala.dev/chat",
      priority: 0.8,
      changeFrequency: "daily",
    },
  ];
}
