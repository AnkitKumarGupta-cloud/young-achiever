/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // photo uploads go through server actions (resized server-side)
    serverActions: { bodySizeLimit: '8mb' },
  },
  async headers() {
    return [
      {
        // Belt and braces: header + <meta robots> + robots.txt
        source: '/achievers/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, noimageindex' }],
      },
    ];
  },
};

module.exports = nextConfig;
