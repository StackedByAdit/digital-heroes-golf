/** @type {import('next').NextConfig} */
const config = {
  images: {
    domains: ['YOUR_SUPABASE_PROJECT.supabase.co'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
};

export default config;
