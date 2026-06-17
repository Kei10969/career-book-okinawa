import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  // ページ遷移時のプリフェッチを有効化（デフォルトだが明示的に設定）
  reactStrictMode: true,
};

export default nextConfig;
