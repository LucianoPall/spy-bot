import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["apify-client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rrtsfhhutbneaxpuubra.supabase.co",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
};

export default nextConfig;
