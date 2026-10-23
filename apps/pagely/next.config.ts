import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.join(appDir, "../.."),
  },
  allowedDevOrigins: ["*"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }] }];
  },
};

export default nextConfig;
