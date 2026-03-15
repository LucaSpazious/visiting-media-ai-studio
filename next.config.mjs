/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'bcryptjs'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'absybsplmgsuswxroqgc.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: '*.fal.media',
      },
    ],
  },
};

export default nextConfig;
