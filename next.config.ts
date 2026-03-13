import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["apify-client"],
  images: {
    localPatterns: [
      {
        pathname: "/api/proxy-image",
        search: "",
      },
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/proxy-image**",
        search: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3004",
        pathname: "/api/proxy-image**",
        search: "**",
      },
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
