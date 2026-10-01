import type { NextConfig } from "next";

/**
 * One stable ID per deployment, shared by every server instance.
 * A random value would differ between `next build`, `next start` and each
 * container, so clients would keep detecting "version skew" and hard-reloading.
 * Set DEPLOYMENT_VERSION (or GIT_SHA) in CI; when unset, Next.js defaults apply.
 */
const deploymentVersion = process.env.DEPLOYMENT_VERSION || process.env.GIT_SHA || undefined;

/** Backend origin, so product media served by the API passes next/image and the CSP. */
const apiUrl = new URL(
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://13.140.181.253/api/v1"
);
const apiOrigin = apiUrl.origin;

/** Google Identity Services (the "Continue with Google" button). */
const google = "https://accounts.google.com";

const nextConfig: NextConfig = {
  // Standalone server bundle (only the deps actually used, not the full
  // node_modules tree) - much lower memory/disk footprint in production.
  // Requires .next/static and public/ to be copied next to the standalone
  // server.js after build - see the "postbuild" script in package.json.
  output: "standalone",

  // Automatic memoization (useMemo/useCallback/memo) with zero code changes
  reactCompiler: true,

  // Pin the build ID and deployment ID to the CI-provided version (see above).
  // Returning null keeps Next.js's own generated build ID.
  generateBuildId: async () => deploymentVersion ?? null,

  // Next.js adds this identifier to deployment-sensitive asset requests,
  // preventing clients from silently mixing assets from different releases.
  ...(deploymentVersion ? { deploymentId: deploymentVersion } : {}),

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
      // Media uploaded through the admin panel is served from the API host.
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        ...(apiUrl.port ? { port: apiUrl.port } : {}),
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          // The legacy XSS auditor is removed from browsers; "0" is the current recommendation.
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          // The store uses none of these; interest-cohort (FLoC) no longer exists.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Content-Security-Policy', value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${google}/gsi/client`,
              `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${google}/gsi/style`,
              `img-src 'self' data: blob: https: ${apiOrigin}`,
              "media-src 'self' blob: data:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "worker-src 'self' blob:",
              `connect-src 'self' ${google}/gsi/`,
              `frame-src 'self' ${google}/gsi/`,
              "frame-ancestors 'none'",
              "object-src 'none'"
            ].join('; ')



          }
        ],
      }

    ]
  },
  // Turbopack's file-system cache is on by default for dev (16.1+) and build (16.3+),
  // and lucide-react / date-fns barrel imports are optimized by default, so no
  // experimental flags are needed. The packages previously listed here
  // (radix-ui, swiper, react-quill-new) are not dependencies of this project.
};

export default nextConfig;