/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'carbon-emissions-compliance-ai.vercel.app'],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Cache-Control, Pragma, Accept',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
