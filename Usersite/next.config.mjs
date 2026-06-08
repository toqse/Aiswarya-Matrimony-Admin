/** @type {import('next').NextConfig} */
// If the site is served from a subpath (e.g. https://domain.com/matrimony/), set:
// NEXT_PUBLIC_BASE_PATH=/matrimony — so CSS/JS load from /matrimony/_next/... not /_next/...
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = rawBase.replace(/\/$/, "") || "";

const nextConfig = {
  reactStrictMode: true,
  // Build to /out for cPanel/static hosting
  output: "export",
  // Nice static paths like /about/ → /about/index.html
  trailingSlash: true,
  images: {
    // Required for static export unless you add a custom image loader
    unoptimized: true,
  },
  transpilePackages: [],
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
