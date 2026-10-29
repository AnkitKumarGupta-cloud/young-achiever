import 'server-only';
import { headers } from 'next/headers';

/**
 * The public address of this site, used to show full share links.
 * Order: NEXT_PUBLIC_SITE_URL (set this if you add a custom domain) -> Vercel's production domain -> request host.
 */
export function siteOrigin(): string {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL;
  if (fixed) return fixed.replace(/\/+$/, '');
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
