import type { NextConfig } from "next";

// Tile providers used by LocationPickerModal (Leaflet)
const TILE_SOURCES = [
  "https://*.tile.openstreetmap.org",
  "https://*.tile.opentopomap.org",
  "https://server.arcgisonline.com",
  "https://*.arcgisonline.com",
  "https://*.google.com",
  "https://*.googleapis.com",
  "https://*.gstatic.com",
  "https://mt0.google.com",
  "https://mt1.google.com",
  "https://mt2.google.com",
  "https://mt3.google.com",
].join(" ");

const BACKEND = [
  "https://backendcartasocial.dgis.gov.cv",
  "http://84.247.171.243:8000",
  "http://localhost:8000",
].join(" ");

// Content-Security-Policy blocks:
//  • data: URI scripts  — attack vector used in the ClickFix incident
//  • inline eval         — not needed by this app
//  • external RPC calls to blockchain nodes — used by the malicious payload
const CSP = [
  // Scripts: only from same origin + Next.js inline chunks ('unsafe-inline' covers hydration).
  // Explicitly NO 'data:' — this alone blocks the attack vector.
  `script-src 'self' 'unsafe-inline'`,

  // Styles: same origin + inline (Tailwind/Leaflet inject inline styles)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,

  // Images: same origin + data URIs for small inline images + tile providers + backend
  `img-src 'self' data: blob: ${TILE_SOURCES} ${BACKEND}`,

  // Fetch/XHR: only to own origin and the Django backend.
  // This blocks calls to blockchain RPC endpoints (BSC Testnet nodes).
  `connect-src 'self' ${BACKEND} ${TILE_SOURCES}`,

  // Workers (used by Leaflet tile rendering)
  `worker-src 'self' blob:`,

  // No plugins, no frames from foreign origins
  `object-src 'none'`,
  `frame-src 'none'`,
  `frame-ancestors 'none'`,

  // All other fetch destinations default to same origin
  `default-src 'self'`,

  // Upgrade insecure requests on production
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: CSP,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    // Allow geolocation (needed for GPS in LocationPickerModal); deny everything else
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
