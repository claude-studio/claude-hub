import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
