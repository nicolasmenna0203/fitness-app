import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // iOS pide /apple-touch-icon.png por su cuenta, además del <link> de la página.
  async rewrites() {
    return [{ source: "/apple-touch-icon.png", destination: "/apple-icon" }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
