import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Base Supabase : données, connexion et photos des produits (Storage)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const supabase = supabaseUrl ? ` ${supabaseUrl.origin}` : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabase}`,
  "font-src 'self'",
  `connect-src 'self'${supabase}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  experimental: {
    // photos des produits envoyées depuis le back-office
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseUrl ? [{ protocol: "https", hostname: supabaseUrl.hostname, pathname: "/storage/v1/object/public/**" }] : [],
    qualities: [75],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
