import type { NextConfig } from "next";
import crypto from "crypto"

const deploymentVersion = crypto.randomBytes(8).toString('hex')

const nextConfig: NextConfig = {
  // Standalone server bundle (only the deps actually used, not the full
  // node_modules tree) - much lower memory/disk footprint in production.
  // Requires .next/static and public/ to be copied next to the standalone
  // server.js after build - see the "postbuild" script in package.json.
  output: "standalone",

  // Automatic memoization (useMemo/useCallback/memo) with zero code changes
  reactCompiler: true,

  // Pin build ID to environment variable for deployment consistency
  // generateBuildId: async () => deploymentVersion,
  generateBuildId: async () => deploymentVersion,

  // Next.js adds this identifier to deployment-sensitive asset requests,
  // preventing clients from silently mixing assets from different releases.
  deploymentId: deploymentVersion,

  // Next 16's new caching model (replaces old PPR flag). Static shells render
  // instantly while dynamic parts stream in — biggest win for perceived speed.
  cacheComponents: true,

  // Gzip/Brotli response compression (on by default, but explicit doesn't hurt)
  compress: true,

  // Strips the X-Powered-By header — trivial but free
  poweredByHeader: false,


  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // cache optimized images 31 days instead of the new 4h default
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.nogodbazar.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Content-Security-Policy', value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: data:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "worker-src 'self' blob:",
              "connect-src 'self'",
              "frame-src 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'"
            ].join('; ')



          }
        ],
      }

    ]
  },
  experimental: {
    // Caches Turbopack's compiled output on disk between dev sessions —
    // much faster cold starts/restarts on a big app
    turbopackFileSystemCacheForDev: true,

    // Tree-shakes barrel-file imports so only the pieces you actually use ship.
    // lucide-react is already optimized by default; these two aren't.
    optimizePackageImports: ["radix-ui", "swiper", "react-quill-new"],
  },
};

export default nextConfig;