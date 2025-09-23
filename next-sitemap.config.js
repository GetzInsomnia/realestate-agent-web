const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zomzomproperty.com";
const locales = ["th", "en", "zh-CN", "zh-TW", "my", "ru"];

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl,
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  transform: async (_, loc) => {
    const alternateRefs = locales.map((locale) => ({
      href: `${siteUrl.replace(/\/$/, "")}/${locale}${loc === "/" ? "" : loc}`,
      hreflang: locale,
    }));

    return {
      loc: `${siteUrl.replace(/\/$/, "")}${loc}`,
      changefreq: "weekly",
      priority: loc === "/" ? 1 : 0.7,
      alternateRefs,
    };
  },
};

export default config;
