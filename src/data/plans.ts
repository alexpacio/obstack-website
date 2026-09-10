export type Deployment = 'self-hosted' | 'cloud';
export type PlanId = 'bee' | 'stack' | 'cloud';
export type Term = 12 | 36;

export interface Plan {
  id: PlanId;
  deployment: Deployment;
  name: string;
  short: string;
  /** Euro list per node per month on a 12-month term, before volume and term discounts. USD is list × USD_MARKUP. */
  price: number;
  /** Smallest node count the plan is sold for. */
  minNodes: number;
  blurb: string;
  features: string[];
  /**
   * `none`: the plan has no backend that stores data. `optional`: a managed
   * bucket can be added, or the customer brings their own. `required`: we run
   * the backend, so the order always includes storage.
   */
  storage: 'none' | 'optional' | 'required';
}

export const PLANS: Plan[] = [
  {
    id: 'bee',
    deployment: 'self-hosted',
    name: 'Bee',
    short: 'Bee',
    price: 15,
    minNodes: 1,
    blurb: 'Distributed tracing and profiling, inside the service and on the host, exporting to the collector you already run.',
    features: [
      'Distributed tracing and profiling, intra-service and intra-host',
      'HTTP, gRPC, TLS, MySQL, Redis and named Node.js awaits',
      'OTLP to any OpenTelemetry collector',
      'Email support, next business day',
    ],
    storage: 'none',
  },
  {
    id: 'stack',
    deployment: 'self-hosted',
    name: 'Obstack Stack',
    short: 'Stack',
    price: 25,
    minNodes: 3,
    blurb: 'The complete stack on your servers, air-gapped sites included.',
    features: [
      'Bee plus Beyla, Vector, Kafka, GreptimeDB, Grafana and Keep',
      'Setup, updates, ongoing rollout and monitoring of the infrastructure included',
      'Unlimited users, dashboards and alert rules',
      'P1 answered in 4 business hours',
      'Custom Grafana dashboards, alerts and similar: Professional Services, quoted in advance',
    ],
    storage: 'optional',
  },
  {
    id: 'cloud',
    deployment: 'cloud',
    name: 'Obstack Cloud',
    short: 'Cloud',
    price: 39,
    minNodes: 3,
    blurb: 'The same stack, operated by us in the region you choose. You install the agents; we run the rest.',
    features: [
      'Same stack, operated by us; you install the agents',
      'Setup, updates, ongoing rollout and monitoring of the infrastructure included',
      'Datacenter in the EU or the US, you choose',
      '99.9% SLA, P1 answered in 1 hour, 24/7',
      'Custom Grafana dashboards, alerts and similar: Professional Services, quoted in advance',
    ],
    storage: 'required',
  },
];

/**
 * Object storage we provision and bill with the plan. Priced per GB of
 * compressed data at rest. Egress and API calls are included; there is no
 * minimum storage duration, which matters because retention deletes telemetry
 * every day. Each deployment lands in the region the customer picks.
 */
export const STORAGE = {
  /** USD per GB per month of compressed data at rest. */
  pricePerGb: 0.007,
  regions: ['EU', 'US'] as const,
  minGb: 100,
  maxGb: 1_000_000,
};

export type Datacenter = 'eu' | 'us';
export const DATACENTER = {
  eu: { id: 'eu', label: 'EU', name: 'EU' },
  us: { id: 'us', label: 'US', name: 'US' },
} as const;

export function regionList(): string {
  return 'EU or US';
}

/** Graduated: each node is priced by the band it falls in, so adding a node never lowers the total. */
export const VOLUME_TIERS = [
  { from: 1, to: 24, off: 0 },
  { from: 25, to: 99, off: 0.1 },
  { from: 100, to: Infinity, off: 0.2 },
];

/** Applies to node fees only, on top of volume discounts. */
export const TERM_DISCOUNT: Record<Term, number> = { 12: 0, 36: 0.15 };

export const MAX_NODES = 9999;

/** Public list price used for the side-by-side estimate, reviewed September 2026. */
export const BASELINE = {
  vendor: 'Datadog',
  perHost: 46,
  detail: 'Infrastructure Pro + APM Pro list price, billed annually, before logs, indexed spans and custom metrics',
};

/** List amounts in this file are euros. USD is always this factor above EUR. */
export const USD_MARKUP = 1.25;

export const CURRENCY = {
  usd: { code: 'USD', locale: 'en-US' },
  eur: { code: 'EUR', locale: 'en-IE' },
} as const;
export type Currency = keyof typeof CURRENCY;

const EURO_LANGS = new Set([
  'it', 'de', 'fr', 'es', 'nl', 'pt', 'fi', 'el', 'sk', 'sl', 'et', 'lv', 'lt', 'ga', 'mt', 'lb', 'ca', 'eu', 'gl', 'hr',
]);
const EURO_REGIONS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH', 'AD', 'MC', 'SM', 'VA', 'GB',
]);

/** EUR for euro-area and European locales; USD otherwise. */
export function currencyFromLocales(locales: readonly string[]): Currency {
  for (const raw of locales) {
    const tag = raw.trim().replace('_', '-');
    if (!tag) continue;
    const parts = tag.split('-');
    const lang = parts[0].toLowerCase();
    const region = parts.slice(1).map((p) => p.toUpperCase()).find((p) => p.length === 2) ?? '';
    if (region) {
      if (EURO_REGIONS.has(region)) return 'eur';
      continue;
    }
    if (EURO_LANGS.has(lang)) return 'eur';
  }
  return 'usd';
}

export function currencyFromBrowser(): Currency {
  if (typeof navigator === 'undefined') return 'usd';
  const list = (navigator.languages?.length ? navigator.languages : [navigator.language]).filter(Boolean);
  return currencyFromLocales(list);
}

export interface Config {
  planId: PlanId;
  nodes: number;
  /** 0 means the customer brings their own storage (self-hosted Stack only). */
  storageGb: number;
  dc: Datacenter;
  term: Term;
  currency: Currency;
}

export const DEFAULT_CONFIG: Config = { planId: 'cloud', nodes: 10, storageGb: 2000, dc: 'eu', term: 12, currency: 'usd' };

export interface Quote extends Config {
  plan: Plan;
  /** Node fees per month at list price. */
  listNodes: number;
  volumeSaving: number;
  termSaving: number;
  /** Node fees per month after discounts. */
  nodesMonthly: number;
  storageMonthly: number;
  monthly: number;
  annual: number;
  /** Node fee per node after discounts. */
  perNode: number;
}

/** Plan ids used by links published before the plans were renamed. */
const LEGACY_IDS: Record<string, PlanId> = { 'bee-starter': 'bee', 'bee-production': 'bee' };

export function findPlan(id: string | null | undefined): Plan {
  const key = (id && LEGACY_IDS[id]) || id;
  return PLANS.find((p) => p.id === key) ?? PLANS.find((p) => p.id === DEFAULT_CONFIG.planId)!;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampInt = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)));

/** Clamps a configuration to what its plan allows. */
export function normalize(config: Config): Config {
  const plan = findPlan(config.planId);
  const storageGb =
    plan.storage === 'none' ? 0 : clampInt(config.storageGb, plan.storage === 'required' ? STORAGE.minGb : 0, STORAGE.maxGb);
  return {
    planId: plan.id,
    nodes: clampInt(config.nodes, plan.minNodes, MAX_NODES),
    storageGb,
    dc: config.dc === 'us' ? 'us' : 'eu',
    term: config.term === 36 ? 36 : 12,
    currency: config.currency || 'usd',
  };
}

export function needsDatacenter(config: Config): boolean {
  const plan = findPlan(config.planId);
  return plan.storage === 'required' || config.storageGb > 0;
}

/** Node fees per month, before the term discount. */
export function nodeFees(price: number, nodes: number): number {
  return VOLUME_TIERS.reduce((sum, t) => sum + Math.max(0, Math.min(nodes, t.to) - t.from + 1) * price * (1 - t.off), 0);
}

export function quote(config: Config): Quote {
  const c = normalize(config);
  const plan = findPlan(c.planId);
  const listNodes = plan.price * c.nodes;
  const afterVolume = nodeFees(plan.price, c.nodes);
  const nodesMonthly = round2(afterVolume * (1 - TERM_DISCOUNT[c.term]));
  const storageMonthly = round2(c.storageGb * STORAGE.pricePerGb);
  const monthly = round2(nodesMonthly + storageMonthly);
  return {
    ...c,
    plan,
    listNodes,
    volumeSaving: round2(listNodes - afterVolume),
    termSaving: round2(afterVolume - nodesMonthly),
    nodesMonthly,
    storageMonthly,
    monthly,
    annual: round2(monthly * 12),
    perNode: round2(nodesMonthly / c.nodes),
  };
}

/** Reads `?plan=&nodes=&gb=&term=`, as written by `configQuery`. `tb=` is treated as thousands of GB. */
export function configFromSearch(search: string): Config {
  const params = new URLSearchParams(search);
  const num = (key: string, fallback: number) => {
    const n = Number.parseInt(params.get(key) ?? '', 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const currencyParam = params.get('currency');
  const currency = currencyParam === 'eur' || currencyParam === 'usd' ? currencyParam : currencyFromBrowser();
  const dc = params.get('dc') === 'us' ? 'us' : 'eu';
  const gb = params.has('gb')
    ? num('gb', DEFAULT_CONFIG.storageGb)
    : params.has('tb')
      ? num('tb', 2) * 1000
      : DEFAULT_CONFIG.storageGb;
  return normalize({
    planId: findPlan(params.get('plan')).id,
    nodes: num('nodes', DEFAULT_CONFIG.nodes),
    storageGb: gb,
    dc,
    term: num('term', DEFAULT_CONFIG.term) === 36 ? 36 : 12,
    currency,
  });
}

export function configQuery(config: Config): string {
  const c = normalize(config);
  return new URLSearchParams({
    plan: c.planId,
    nodes: String(c.nodes),
    gb: String(c.storageGb),
    dc: c.dc,
    term: String(c.term),
    currency: c.currency,
  }).toString();
}

export function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** The discounted volume bands, for example "25–99 at 10% off". */
export function volumeBands(): string[] {
  return VOLUME_TIERS.filter((t) => t.off > 0).map(
    (t) => `${Number.isFinite(t.to) ? `${t.from}–${t.to}` : `${t.from} and up`} at ${pct(t.off)} off`,
  );
}

/** Converts a euro list amount for display. Quote math stays in EUR; USD is marked up. */
export function toDisplayAmount(amountEur: number, currency: Currency): number {
  return currency === 'usd' ? amountEur * USD_MARKUP : amountEur;
}

export function fxDisclaimer(): string {
  return `USD prices are ${Math.round((USD_MARKUP - 1) * 100)}% above EUR. The invoice is issued in the currency you pick.`;
}

/** Whole dollars (or euros) when the amount is whole, cents otherwise. */
export function formatGb(gb: number): string {
  return `${gb.toLocaleString('en-US')} GB`;
}

export function formatPrice(amountEur: number, currency: Currency = 'usd'): string {
  const raw = toDisplayAmount(amountEur, currency);
  const digits = raw > 0 && raw < 0.01 ? 5 : Math.abs(raw - Math.round(raw)) < 1e-9 ? 0 : 2;
  const value = Number(raw.toFixed(digits));
  const { code, locale } = CURRENCY[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
