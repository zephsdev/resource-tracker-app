/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },  // optional but recommended for static
};

module.exports = nextConfig;