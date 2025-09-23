import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n.ts");

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  eslint: {
    dirs: ["src", "scripts"],
  },
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
