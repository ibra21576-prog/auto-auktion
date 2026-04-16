import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent firebase packages from being bundled server-side
  // (they are client-only, initialized in AuthContext which is 'use client')
  serverExternalPackages: [
    'firebase',
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
    'firebase/storage',
  ],
};

export default nextConfig;
