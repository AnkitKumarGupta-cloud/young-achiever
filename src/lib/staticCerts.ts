import type { PhotoItem } from './types';

/**
 * Certificates added by the site owner (files live in /public/certs/<slug>/).
 * Shown after any certificates the parent uploads. They only render as part of a page that is visible.
 */
const STATIC_CERTS: Record<string, { file: string; caption: string }[]> = {
  priyanshi: [
    { file: 'western-asian-2026-classical.jpg', caption: 'Western Asian Youth Championship 2026 · Classical' },
    { file: 'western-asian-2026-rapid.jpg', caption: 'Western Asian Youth Championship 2026 · Rapid' },
    { file: 'western-asian-2026-blitz.jpg', caption: 'Western Asian Youth Championship 2026 · Blitz' },
    { file: 'rotaract-ruas-2026-rapid.jpg', caption: 'Rotaract RUAS All India Open 2026 · Rapid' },
  ],
};

export function staticCerts(slug: string): PhotoItem[] {
  return (STATIC_CERTS[slug] ?? []).map((c) => ({ id: `static-${c.file}`, url: `/certs/${slug}/${c.file}`, caption: c.caption }));
}
