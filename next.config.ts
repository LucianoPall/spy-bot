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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
    ],
  },
};

export default nextConfig;
