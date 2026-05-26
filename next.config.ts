import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["apify-client"],
  // Pin the workspace root to this project so Turbopack doesn't pick up a
  // stray lockfile higher up the tree (e.g. C:\Users\<user>\package-lock.json).
  turbopack: {
    root: __dirname,
  },
  redirects: async () => [
    {
      source: "/",
      destination: "/vendas.html",
      permanent: false,
    },
  ],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        // HSTS só no deploy de produção real (Vercel). NÃO usar NODE_ENV aqui:
        // rodar `npm start` localmente liga NODE_ENV=production mas continua em
        // http://localhost — enviar HSTS nesse caso "polui" o cache do navegador
        // e força https://localhost depois (ERR_SSL_PROTOCOL_ERROR). VERCEL_ENV
        // só existe em deploys na Vercel, nunca em ambiente local.
        ...(process.env.VERCEL_ENV === "production"
          ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
          : []),
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
  images: {
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
        port: "3001",
        pathname: "/api/proxy-image**",
        search: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
        pathname: "/api/proxy-image**",
        search: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3003",
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
        pathname: "/**",
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
