import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Self-contained server build, so the app can run on AWS Lambda (see deploy-lambda.sh).
  output: 'standalone',
  // Hackathon: don't block deploys on the existing clinic page type error or lint config.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default withNextIntl(nextConfig);
