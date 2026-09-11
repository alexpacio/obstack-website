export type Deployment = 'self-hosted' | 'cloud';
export type PlanId = 'bee' | 'stack' | 'cloud';
/** 1 = billed monthly at list; 12 = billed yearly, 10% off; 36 = 3-year, 20% off, billed yearly. */
export type Term = 1 | 12 | 36;

export interface Plan {
  id: PlanId;
  deployment: Deployment;
  name: string;
  short: string;
  /** Euro list per node per month, billed monthly, before volume and billing discounts. USD is list × USD_MARKUP. */
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
    blurb: 'The complete stack on your servers.',
    features: [
      'Bee plus Beyla, Vector, Kafka, GreptimeDB, Grafana and Alertmanager',
      'PageRoot on-call module optional, priced per user',
      'Aurora AI optional: unlimited DeepSeek 4 Flash, hosted by Obstack',
      'Setup, updates, ongoing rollout and monitoring of the infrastructure included',
      'Unlimited Grafana users, dashboards and alert rules',
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
      'PageRoot on-call module optional, priced per user',
      'Aurora AI optional: unlimited DeepSeek 4 Flash, hosted by Obstack',
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
/**
 * Optional on-call module on Stack and Cloud. Priced per on-call user, not
 * per node. Euro list billed monthly; USD is list × USD_MARKUP.
 */
export const PAGEROOT = {
  selfHosted: 4,
  cloud: 8,
  minUsers: 1,
  maxUsers: 9999,
  defaultUsers: 5,
} as const;

export function allowsPageroot(planId: PlanId): boolean {
  return planId === 'stack' || planId === 'cloud';
}

/** Euro list per on-call user per month for this plan. Zero on Bee. */
export function pagerootUnitPrice(planId: PlanId): number {
  if (planId === 'cloud') return PAGEROOT.cloud;
  if (planId === 'stack') return PAGEROOT.selfHosted;
  return 0;
}

/**
 * Optional Aurora AI bundle on Stack and Cloud: the AI SRE plus unlimited
 * DeepSeek 4 Flash inference hosted by Obstack. Flat euro list per month;
 * USD is list × USD_MARKUP. Not volume- or billing-discounted.
 */
export const AURORA = {
  price: 199,
  model: 'DeepSeek 4 Flash',
} as const;

export function allowsAurora(planId: PlanId): boolean {
  return planId === 'stack' || planId === 'cloud';
}

export const STORAGE = {
  /** Euro list per GB per month of compressed data at rest; USD is list × USD_MARKUP. */
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

/** Billing discount on node and PageRoot fees, on top of volume. Storage and Aurora are not discounted. */
export const TERM_DISCOUNT: Record<Term, number> = { 1: 0, 12: 0.1, 36: 0.2 };

export function parseTerm(n: number): Term {
  if (n === 1 || n === 12 || n === 36) return n;
  return 12;
}

export function termLabel(term: Term): string {
  if (term === 1) return 'Monthly';
  if (term === 36) return '3 years';
  return 'Yearly';
}

export function invoiceLabel(term: Term): string {
  return term === 1 ? 'Billed monthly' : 'Billed yearly';
}

export function termSavingLabel(term: Term): string {
  return term === 36 ? '3-year term' : 'Yearly billing';
}

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

/**
 * Countries and territories whose legal tender is the euro: the euro area,
 * the states that use it by monetary agreement, and the EU outermost regions.
 * A visitor anywhere else is billed in USD.
 */
export const EURO_COUNTRIES = new Set([
  // Euro area
  'AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
  // By monetary agreement, or unilaterally
  'AD', 'MC', 'SM', 'VA', 'ME', 'XK',
  // Outermost regions and territories that use the euro
  'GF', 'GP', 'MQ', 'YT', 'RE', 'PM', 'BL', 'MF', 'AX',
]);

/**
 * Languages spoken essentially only in euro countries, used when the locale
 * carries no region. Deliberately excludes ambiguous ones (`es` covers Latin
 * America, `sv`/`da`/`pl`/`cs`/`hu`/`ro`/`is` are non-euro countries).
 */
const EURO_ONLY_LANGS = new Set([
  'it', 'de', 'fr', 'nl', 'pt', 'fi', 'el', 'sk', 'sl', 'et', 'lv', 'lt', 'ga', 'mt', 'lb', 'ca', 'eu', 'gl', 'hr', 'bg',
]);

/** IANA zones that sit in a euro country, for when the locale has no region. */
const EURO_TIMEZONES = new Set([
  'Europe/Vienna', 'Europe/Brussels', 'Europe/Sofia', 'Europe/Zagreb', 'Asia/Nicosia', 'Europe/Nicosia',
  'Europe/Tallinn', 'Europe/Helsinki', 'Europe/Mariehamn', 'Europe/Paris', 'Europe/Berlin', 'Europe/Busingen',
  'Europe/Athens', 'Europe/Dublin', 'Europe/Rome', 'Europe/Riga', 'Europe/Vilnius', 'Europe/Luxembourg',
  'Europe/Malta', 'Europe/Amsterdam', 'Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores',
  'Europe/Bratislava', 'Europe/Ljubljana', 'Europe/Madrid', 'Africa/Ceuta', 'Atlantic/Canary',
  'Europe/Andorra', 'Europe/Monaco', 'Europe/San_Marino', 'Europe/Vatican', 'Europe/Podgorica',
  'America/Cayenne', 'America/Guadeloupe', 'America/Martinique', 'Indian/Mayotte', 'Indian/Reunion',
  'America/Miquelon', 'America/St_Barthelemy', 'America/Marigot',
]);

function parseLocale(tag: string): { lang: string; region: string } {
  const normalized = tag.trim().replaceAll('_', '-');
  try {
    const loc = new Intl.Locale(normalized);
    return { lang: (loc.language || '').toLowerCase(), region: (loc.region || '').toUpperCase() };
  } catch {
    const parts = normalized.split('-');
    return {
      lang: (parts[0] || '').toLowerCase(),
      region: (parts.slice(1).map((x) => x.toUpperCase()).find((x) => x.length === 2) ?? ''),
    };
  }
}

/** EUR when the locale names a euro country; otherwise no answer. */
export function currencyFromLocales(locales: readonly string[]): Currency | null {
  // A region is hard evidence, so take the first locale that carries one.
  for (const raw of locales) {
    if (!raw) continue;
    const { region } = parseLocale(raw);
    if (region) return EURO_COUNTRIES.has(region) ? 'eur' : 'usd';
  }
  // No region anywhere: fall back to languages that name one country group.
  for (const raw of locales) {
    if (!raw) continue;
    const { lang } = parseLocale(raw);
    if (EURO_ONLY_LANGS.has(lang)) return 'eur';
  }
  return null;
}

/** EUR when the browser's time zone sits in a euro country; otherwise no answer. */
export function currencyFromTimezone(): Currency | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz && EURO_TIMEZONES.has(tz)) return 'eur';
  } catch {
    /* ignore */
  }
  return null;
}

/** Browser locale first, then time zone. USD when neither names a euro country. */
export function currencyFromBrowser(): Currency {
  if (typeof navigator === 'undefined') return 'usd';
  const list = (navigator.languages?.length ? navigator.languages : [navigator.language]).filter(Boolean);
  return currencyFromLocales(list) ?? currencyFromTimezone() ?? 'usd';
}

export const CURRENCY_STORAGE_KEY = 'obstack-currency';
export const CURRENCY_EVENT = 'obstack:currency';

export function readStoredCurrency(): Currency | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const c = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (c === 'eur' || c === 'usd') return c;
  } catch {
    /* ignore */
  }
  return null;
}

/** Stored choice, else browser language and timezone. */
export function preferredCurrency(): Currency {
  // The boot script in the layout already made this decision before first
  // paint; reuse it so the islands and the CSS-driven prices never disagree.
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-currency');
    if (attr === 'eur' || attr === 'usd') return attr;
  }
  return readStoredCurrency() ?? currencyFromBrowser();
}

/** Writes the site-wide currency and notifies the configurator. */
export function persistCurrency(c: Currency): void {
  if (typeof document === 'undefined') return;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, c);
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute('data-currency', c);
  window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: c }));
}

export interface Config {
  planId: PlanId;
  nodes: number;
  /** 0 means the customer brings their own storage (self-hosted Stack only). */
  storageGb: number;
  dc: Datacenter;
  term: Term;
  currency: Currency;
  /** 0 means PageRoot is not on the order. Stack and Cloud only. */
  pagerootUsers: number;
  /** Aurora AI plus Obstack-hosted DeepSeek 4 Flash. Stack and Cloud only. */
  aurora: boolean;
}

export const DEFAULT_CONFIG: Config = { planId: 'cloud', nodes: 10, storageGb: 2000, dc: 'eu', term: 12, currency: 'usd', pagerootUsers: 0, aurora: false };

export interface Quote extends Config {
  plan: Plan;
  /** Node fees per month at list price. */
  listNodes: number;
  volumeSaving: number;
  termSaving: number;
  /** Node fees per month after discounts. */
  nodesMonthly: number;
  storageMonthly: number;
  /** PageRoot fees per month at list price. */
  listPageroot: number;
  pagerootVolumeSaving: number;
  pagerootTermSaving: number;
  /** PageRoot fees per month after discounts. */
  pagerootMonthly: number;
  /** Aurora bundle per month at list. Zero when not on the order. */
  auroraMonthly: number;
  monthly: number;
  annual: number;
  /** Amount due on this invoice: one month, or twelve months in advance. */
  invoice: number;
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
  const pagerootUsers = allowsPageroot(plan.id)
    ? config.pagerootUsers > 0
      ? clampInt(config.pagerootUsers, PAGEROOT.minUsers, PAGEROOT.maxUsers)
      : 0
    : 0;
  const aurora = allowsAurora(plan.id) && Boolean(config.aurora);
  return {
    planId: plan.id,
    nodes: clampInt(config.nodes, plan.minNodes, MAX_NODES),
    storageGb,
    dc: config.dc === 'us' ? 'us' : 'eu',
    term: parseTerm(config.term),
    currency: config.currency || 'usd',
    pagerootUsers,
    aurora,
  };
}

export function needsDatacenter(config: Config): boolean {
  const plan = findPlan(config.planId);
  return plan.storage === 'required' || config.storageGb > 0 || config.aurora;
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
  const prPrice = pagerootUnitPrice(c.planId);
  const listPageroot = prPrice * c.pagerootUsers;
  const pagerootAfterVolume = c.pagerootUsers > 0 ? nodeFees(prPrice, c.pagerootUsers) : 0;
  const pagerootMonthly = round2(pagerootAfterVolume * (1 - TERM_DISCOUNT[c.term]));
  const auroraMonthly = c.aurora ? AURORA.price : 0;
  const monthly = round2(nodesMonthly + storageMonthly + pagerootMonthly + auroraMonthly);
  return {
    ...c,
    plan,
    listNodes,
    volumeSaving: round2(listNodes - afterVolume),
    termSaving: round2(afterVolume - nodesMonthly),
    nodesMonthly,
    storageMonthly,
    listPageroot,
    pagerootVolumeSaving: round2(listPageroot - pagerootAfterVolume),
    pagerootTermSaving: round2(pagerootAfterVolume - pagerootMonthly),
    pagerootMonthly,
    auroraMonthly,
    monthly,
    annual: round2(monthly * 12),
    invoice: round2(c.term === 1 ? monthly : monthly * 12),
    perNode: round2(nodesMonthly / c.nodes),
  };
}

/** Reads `?plan=&nodes=&gb=&term=&seats=&aurora=`, as written by `configQuery`. `tb=` is treated as thousands of GB. */
export function configFromSearch(search: string): Config {
  const params = new URLSearchParams(search);
  const num = (key: string, fallback: number) => {
    const n = Number.parseInt(params.get(key) ?? '', 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const currencyParam = params.get('currency');
  const currency = currencyParam === 'eur' || currencyParam === 'usd' ? currencyParam : preferredCurrency();
  if (currencyParam === 'eur' || currencyParam === 'usd') persistCurrency(currencyParam);
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
    term: parseTerm(num('term', DEFAULT_CONFIG.term)),
    currency,
    pagerootUsers: num('seats', 0),
    aurora: params.get('aurora') === '1' || params.get('aurora') === 'on',
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
    seats: String(c.pagerootUsers),
    aurora: c.aurora ? '1' : '0',
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
  return `The invoice is issued in the currency you pick.`;
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

/** Both currencies, so the page can switch from `data-currency` without a reload. */
export function dualPrice(amountEur: number): string {
  return `<span class="ob-price"><span class="ob-usd">${formatPrice(amountEur, 'usd')}</span><span class="ob-eur">${formatPrice(amountEur, 'eur')}</span></span>`;
}
