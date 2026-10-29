import 'server-only';

/** Parent usernames map to a synthetic email. No email is ever sent. */
export function toEmail(username: string): string {
  const u = username.trim().toLowerCase();
  if (u.includes('@')) return u;
  const domain = process.env.AUTH_EMAIL_DOMAIN || 'parents.youngachievers.local';
  return `${u}@${domain}`;
}

export function slugify(name: string): string {
  const s = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return s || 'player';
}
