import { createHash } from 'crypto';

export function gravatarUrl(identifier: string, size = 80, forceIdenticon = false): string {
  const hash = createHash('md5').update(identifier.toLowerCase().trim()).digest('hex');
  const params = new URLSearchParams({ s: String(size), d: 'identicon' });
  if (forceIdenticon) params.set('f', 'y');
  return `https://www.gravatar.com/avatar/${hash}?${params}`;
}

export function displayName(firstName: string | null, lastName: string | null, fallback = 'Unknown'): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : fallback;
}
