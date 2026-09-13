/** Prefixes an internal path with the configured Astro `base`. */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : `/${path}`);
}

export type MailtoOpened = (href: string, email: string) => void;

/**
 * Open a contact mailto after human verification.
 * The address is not decoded until the challenge succeeds.
 */
export function openMailto(subject?: string, body?: string, onOpened?: MailtoOpened): void {
  if (typeof window === 'undefined') return;
  window.__obstackOpenMailto?.({ subject, body, onOpened });
}

/** Contact address, only after human verification. Empty otherwise. */
export function contactEmail(): string {
  if (typeof window === 'undefined') return '';
  return window.__obstackContactEmail?.() ?? '';
}
