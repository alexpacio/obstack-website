/** Prefixes an internal path with the configured Astro `base`. */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : `/${path}`);
}

export const CONTACT_EMAIL = 'info@obstack.it';

export function mailto(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString().replace(/\+/g, '%20');
  return `mailto:${CONTACT_EMAIL}${query ? `?${query}` : ''}`;
}
