/// <reference types="astro/client" />

interface ObstackMailtoRequest {
  subject?: string;
  body?: string;
  onOpened?: (href: string, email: string) => void;
}

interface Window {
  __obstackOpenMailto?: (opts?: ObstackMailtoRequest) => void;
  __obstackContactEmail?: () => string;
  onObstackTurnstileVerified?: (token: string) => void;
}

interface ImportMetaEnv {
  readonly PUBLIC_MAX_DEMO_CHART_URL?: string;
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
}
