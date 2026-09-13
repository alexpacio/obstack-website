export type Deployment = 'self-hosted' | 'cloud';
export type PlanId = 'starter' | 'go' | 'pro' | 'max';
/** 1 = billed monthly at list; 12 = billed yearly, 10% off; 36 = 3-year, 20% off, billed yearly. */
export type Term = 1 | 12 | 36;

export interface SupportLevel {
  /** Which engineers answer: the escalation tier the plan buys. */
  tier: string;
  channel: string;
  hours: string;
  /** Time to a first reply from an engineer. */
  p1: string;
  p2: string;
  p3: string;
  /** True when the rota answers outside business hours. */
  alwaysOn: boolean;
  /** Reads correctly straight after the word "support": "support in working hours". */
  hoursPhrase: string;
}

export const BUSINESS_HOURS = '09:00–18:00 CET, Monday to Friday, excluding Italian public holidays';

export const SUPPORT: Record<PlanId | 'enterprise', SupportLevel> = {
  starter: {
    tier: 'Best effort',
    channel: 'Email',
    hours: 'Business hours',
    p1: 'Best effort',
    p2: 'Best effort',
    hoursPhrase: 'in business hours, best effort',
    alwaysOn: false,
    p3: 'Best effort',
  },
  go: {
    tier: 'Tier 1',
    channel: 'Email',
    hours: 'Business hours',
    p1: 'Next business day',
    p2: 'Next business day',
    hoursPhrase: 'in business hours',
    alwaysOn: false,
    p3: '2 business days',
  },
  pro: {
    tier: 'Tier 2',
    channel: 'Email and ticketing',
    hours: 'Business hours',
    p1: '2 business hours',
    p2: '4 business hours',
    hoursPhrase: 'in working hours',
    alwaysOn: false,
    p3: '1 business day',
  },
  max: {
    tier: 'Tier 3',
    channel: 'Email, ticketing and phone',
    hours: '24/7, every day of the year',
    p1: '30 minutes, 24/7',
    p2: '2 hours, 24/7',
    hoursPhrase: 'around the clock',
    alwaysOn: true,
    p3: '1 business day',
  },
  enterprise: {
    tier: 'Tier 3, named engineer',
    channel: 'Email, ticketing, phone and a shared channel',
    hours: '24/7, every day of the year',
    p1: 'Per contract, from 15 minutes',
    p2: 'Per contract',
    hoursPhrase: 'around the clock, to your contract',
    alwaysOn: true,
    p3: 'Per contract',
  },
};

export type AddonId = 'pageroot' | 'aurora' | 'storage';

export interface Addon {
  id: AddonId;
  name: string;
  /** Flat euro list per month per unit, whatever the fleet size. */
  price: number;
  unit: string;
  short: string;
  blurb: string;
  /** Plans that can buy it. A plan listing it in `includes` already has it. */
  availableOn: PlanId[];
}

/** The backend each tier runs on: what we provision in Obstack Cloud, and the
 * minimum the customer supplies when the stack runs on their own cluster. */
export interface Infra {
  /** Backend nodes dedicated to this customer. Zero means shared capacity. */
  nodes: number;
  ha: boolean;
  /** True when the backend is multi-tenant capacity rather than dedicated nodes. */
  shared: boolean;
  cores: number;
  ramGb: number;
  disk: string;
  /** The trade-off this sizing makes, in one line. */
  note: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  short: string;
  /** Flat euro list per month. Not per node, not per host, not per user. */
  price: number;
  blurb: string;
  /** The one line that separates this tier from the one below. */
  headline: string;
  features: string[];
  /** Add-ons the plan already includes at no extra cost. */
  includes: AddonId[];
  infra: Infra;
  /**
   * Euro per month taken off the list price when the backend runs on hardware
   * the customer already owns: roughly what we would have spent hosting it.
   */
  onPrem: number;
  /** True when the plan exists only on Obstack Cloud, on shared capacity. */
  cloudOnly: boolean;
  /** Terabytes of object storage included in the price. */
  includedTb: number;
  /** True when ingest is rate limited and shed rather than queued without limit. */
  bestEffort: boolean;
  /** The plan we lead with: highlighted on the cards, and the default CTA. */
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    short: 'Starter',
    price: 49,
    blurb: 'The stack on shared cloud capacity, for a first fleet or a side estate that can live with best-effort ingest.',
    headline: 'Shared cloud capacity · best-effort ingest',
    features: [
      'The full stack on Obstack Cloud, on shared capacity',
      'Unlimited nodes and unlimited Grafana users',
      'Rate-limited, best-effort ingest: excess telemetry is shed, not billed',
      '1 TB of object storage included',
      'Email support, best effort, no response-time commitment',
      'No PageRoot, no Aurora AI, no add-ons',
    ],
    includes: [],
    infra: {
      nodes: 0,
      ha: false,
      shared: true,
      cores: 0,
      ramGb: 0,
      disk: 'Shared capacity',
      note: 'Multi-tenant capacity shared with other Starter tenants. Move to Go for a backend of your own.',
    },
    onPrem: 0,
    cloudOnly: true,
    includedTb: 1,
    bestEffort: true,
  },
  {
    id: 'go',
    name: 'Go',
    short: 'Go',
    price: 529,
    blurb: 'A backend of your own, deployed and supported, for teams that page each other in business hours.',
    headline: 'Dedicated node · email support, next business day',
    features: [
      'The full stack: Bee, Beyla, Vector, Kafka, GreptimeDB, Grafana, Alertmanager',
      'Unlimited nodes, unlimited ingest, unlimited Grafana users',
      'One dedicated backend node: 4 cores, 32 GB RAM, 500 GB NVMe',
      '10 TB of object storage included',
      'Setup, updates, rollout and monitoring of the infrastructure',
      'Email support, next business day response',
      'PageRoot and Aurora AI available as add-ons',
    ],
    includes: [],
    infra: {
      nodes: 1,
      ha: false,
      shared: false,
      cores: 4,
      ramGb: 32,
      disk: '500 GB NVMe',
      note: 'A single backend node, sized for a team that can tolerate a maintenance window.',
    },
    onPrem: 129,
    cloudOnly: false,
    includedTb: 10,
    bestEffort: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    short: 'Pro',
    price: 1599,
    blurb: 'Everything in Go on a much larger node, plus the on-call module and engineers who answer the same working day.',
    headline: 'Tier 2 support in working hours · PageRoot included',
    features: [
      'Everything in Go, same unlimited nodes and ingest',
      'A larger dedicated node: 16 cores, 64 GB RAM, 8 TB NVMe',
      'PageRoot on-call module included: schedules, escalations, ChatOps, MCP',
      'Tier 2 support during working hours, P1 answered in 2 business hours',
      'Quarterly stack review and upgrade planning',
      '10 TB of object storage included',
      'Aurora AI available as an add-on',
    ],
    includes: ['pageroot'],
    infra: {
      nodes: 1,
      ha: false,
      shared: false,
      cores: 16,
      ramGb: 64,
      disk: '8 TB NVMe',
      note: 'A single backend node with room for a busy fleet and months of hot data on local NVMe.',
    },
    onPrem: 399,
    cloudOnly: false,
    includedTb: 10,
    bestEffort: false,
    featured: true,
  },
  {
    id: 'max',
    name: 'Max',
    short: 'Max',
    price: 5099,
    blurb: 'Everything in Pro on a high-availability cluster, with round-the-clock Tier 3 engineers and Aurora AI on a private model.',
    headline: 'Three-node HA · Tier 3 support 24/7 · private LLM',
    features: [
      'Everything in Pro, PageRoot included',
      'Three-node HA cluster: 16 cores, 64 GB RAM, 8 TB NVMe each',
      'Aurora AI included, on a private LLM deployment in the region you pick',
      'Tier 3 support 24/7, P1 answered in 30 minutes, any day of the year',
      'Phone escalation and a 99.9% availability commitment on Obstack Cloud',
      '10 TB of object storage included',
      'Priority on roadmap requests',
    ],
    includes: ['pageroot', 'aurora'],
    infra: {
      nodes: 3,
      ha: true,
      shared: false,
      cores: 16,
      ramGb: 64,
      disk: '8 TB NVMe',
      note: 'Three backend nodes in a high-availability cluster: lose one and the stack keeps ingesting.',
    },
    onPrem: 1099,
    cloudOnly: false,
    includedTb: 10,
    bestEffort: false,
  },
];

export const ADDONS: Addon[] = [
  {
    id: 'pageroot',
    name: 'PageRoot',
    price: 299,
    unit: '/ month',
    short: 'On-call module',
    blurb:
      'Schedules, escalation chains, ChatOps to Slack and Telegram, phone calls and a built-in MCP server. Unlimited on-call users, unlimited incidents. Included on Pro and Max.',
    availableOn: ['go'],
  },
  {
    id: 'aurora',
    name: 'Aurora AI',
    price: 449,
    unit: '/ month',
    short: 'AI SRE',
    blurb:
      'The AI SRE that works incidents through Grafana MCP and PageRoot MCP, with unlimited DeepSeek 4 Flash on the shared Obstack endpoint. Max upgrades this to a private, single-tenant model deployment.',
    availableOn: ['go', 'pro'],
  },
  {
    id: 'storage',
    name: 'Extra storage',
    price: 139,
    unit: '/ 10 TB / month',
    short: 'Beyond the included 10 TB',
    blurb:
      'Object storage in 10 TB blocks, on top of the 10 TB every plan includes. Egress, API requests and early deletion are included, so retention never produces a surprise line.',
    availableOn: ['go', 'pro', 'max'],
  },
];

/** Monthly list for this plan on this deployment, before any billing discount. */
export function planPrice(plan: Plan, deployment: Deployment): number {
  return plan.price - (deployment === 'self-hosted' && !plan.cloudOnly ? plan.onPrem : 0);
}

/** Plans that can run on hardware the customer owns. */
export function allowsSelfHosting(plan: Plan): boolean {
  return !plan.cloudOnly;
}

export function findAddon(id: AddonId): Addon {
  return ADDONS.find((a) => a.id === id)!;
}

export const PAGEROOT = findAddon('pageroot');
export const AURORA = { ...findAddon('aurora'), model: 'DeepSeek 4 Flash' } as const;

/** Object storage: what every plan includes, and what more costs. */
export const STORAGE = {
  /** Terabytes included on the dedicated plans. Starter carries its own figure. */
  includedTb: 10,
  /** Size of one paid block. */
  blockTb: 10,
  /** Euro list per block per month. */
  pricePerBlock: findAddon('storage').price,
  maxBlocks: 99,
  regions: ['EU', 'US'] as const,
};

/**
 * How Starter sheds load. The limits themselves are deliberately unpublished:
 * they move with capacity, and a collector that honours the status codes never
 * needs to know them.
 */
export const RATE_LIMIT = {
  statuses: '429 Too Many Requests and 503 Service Unavailable',
  header: 'Retry-After',
  blurb:
    'Starter ingest is rate limited and best effort. When the bucket is empty the endpoint sheds the batch and answers with a retryable status code; your OpenTelemetry collector retries it with its normal backoff. The limits are not published: they follow the capacity of the shared tier.',
  short: 'Rate limited, best effort. Excess batches are shed, never billed.',
} as const;

/**
 * Commercial terms quoted in more than one place. Kept here so the pricing
 * page, the checkout and the contract text cannot drift apart.
 */
export const COMMERCIAL = {
  /** Days to settle a pro-forma invoice. */
  paymentDays: 30,
  /** Full-refund window on a first order. */
  refundDays: 30,
  /** Written notice before a yearly or multi-year term renews. */
  cancelNoticeDays: 30,
  /** Notice before Cloud access is suspended over an overdue invoice. */
  suspensionNoticeDays: 14,
  /** Days to export telemetry after a Cloud subscription ends. */
  exportDays: 30,
  /** Cap on a renewal increase, and on a mid-year list rise. */
  renewalCap: 0.05,
  /** Availability commitment on the plans that carry one. */
  slaUptime: 0.999,
  /** Credit against that month's fees when availability falls below each mark. */
  slaCredits: [
    { below: 0.999, credit: 0.1 },
    { below: 0.99, credit: 0.25 },
    { below: 0.95, credit: 0.5 },
  ],
} as const;

/** Free evaluation: we deploy the real thing on the customer's cluster. */
export const DEMO = {
  days: 30,
  price: 0,
  blurb:
    'You give us VPN access to your nodes and a Kubernetes cluster of your choice. We deploy the full stack on it, you run your own telemetry through it for 30 days, then you decide.',
} as const;

export const DEPLOYMENTS: { id: Deployment; label: string; note: string }[] = [
  {
    id: 'self-hosted',
    label: 'Your infrastructure',
    note:
      'We deploy the stack on your nodes and the Kubernetes cluster you choose, over a VPN you control, then keep it updated and monitored. Telemetry never leaves your network, and you supply the hardware and the bucket, so the hosting we would have bought comes off the price. Bee and PageRoot ship under a license key for the first month; after you sign the PolyForm Internal Use agreement, git access to the source. Air-gapped delivery is quoted as Enterprise.',
  },
  {
    id: 'cloud',
    label: 'Obstack Cloud',
    note:
      'You install the agents. We provision the nodes and the object storage your plan describes in the EU or US datacenter you pick, and run them: setup, updates, rollout and monitoring included.',
  },
];

/** Nothing about the fleet changes the price, so this is a note, not a lever. */
export const UNMETERED = [
  'Nodes, hosts and Kubernetes workers',
  'Ingest, egress and queries',
  'Grafana users, dashboards and alert rules',
  'Incidents, pages and on-call users',
  'Aurora investigations and tokens',
  'Traces, spans, metrics and log lines',
];

export type Datacenter = 'eu' | 'us';
export const DATACENTER = {
  eu: { id: 'eu', label: 'EU', name: 'EU' },
  us: { id: 'us', label: 'US', name: 'US' },
} as const;

export function regionList(): string {
  return 'EU or US';
}

/** Billing discount on the plan and its add-ons. Extra storage blocks are not discounted. */
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

/**
 * Per-host list prices of the platforms that licence by node, in USD, used to
 * show what the same fleet costs on each as it grows. Reviewed September 2026.
 */
export const PER_NODE_VENDORS = [
  { name: 'Datadog', perHost: 46, platform: 0, detail: 'Infrastructure Pro + APM Pro list, billed annually, before logs and indexed spans' },
  { name: 'Dynatrace', perHost: 58, platform: 0, detail: 'Full-Stack on an 8 GiB host, before ingest and retention' },
  { name: 'Grafana Cloud', perHost: 18, platform: 19, detail: '$0.025 per host-hour plus the $19 platform fee, before GB written' },
];

/**
 * Fleet sizes for the side-by-side, each paired with the plan whose backend
 * actually carries an estate that size. The point of the table is the shape of
 * the two curves: theirs multiplies without end, ours steps a few times and
 * then stops.
 */
export interface Fleet {
  nodes: number;
  planId: PlanId;
  /** Extra qualifier for the column header, where fleet size alone misleads. */
  note?: string;
}

export const FLEETS: Fleet[] = [
  { nodes: 5, planId: 'starter', note: 'low volumes' },
  { nodes: 25, planId: 'go' },
  { nodes: 100, planId: 'pro' },
  { nodes: 500, planId: 'max' },
  { nodes: 2000, planId: 'max' },
];

/** The plan we would put on a fleet this size. */
export function planForFleet(fleet: Fleet): Plan {
  return findPlan(fleet.planId);
}

/** Monthly USD list for a per-node vendor at this fleet size. */
export function vendorMonthly(vendor: { perHost: number; platform: number }, nodes: number): number {
  return vendor.platform + vendor.perHost * nodes;
}

/** Public list price used for the side-by-side estimate, reviewed September 2026. USD. */
export const BASELINE = {
  vendor: 'Datadog',
  perHost: 46,
  detail: 'Infrastructure Pro + APM Pro list price, billed annually, before logs, indexed spans and custom metrics',
};

export const MAX_COMPARE_NODES = 5000;
export const DEFAULT_COMPARE_NODES = 100;

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
  deployment: Deployment;
  dc: Datacenter;
  term: Term;
  currency: Currency;
  /** PageRoot as a paid add-on. Ignored on plans that include it. */
  pageroot: boolean;
  /** Aurora AI as a paid add-on. Ignored on plans that include it. */
  aurora: boolean;
  /** Paid 10 TB blocks on top of the 10 TB every plan includes. */
  storageBlocks: number;
}

export const DEFAULT_CONFIG: Config = {
  planId: 'pro',
  deployment: 'cloud',
  dc: 'eu',
  term: 12,
  currency: 'usd',
  pageroot: false,
  aurora: false,
  storageBlocks: 0,
};

export interface Quote extends Config {
  plan: Plan;
  /** Plan fee per month at list, after any on-premise credit, before the billing discount. */
  listPlan: number;
  /** What running the backend on your own hardware took off the list price. */
  onPremCredit: number;
  /** Plan fee per month after the billing discount. */
  planMonthly: number;
  /** PageRoot fee per month. Zero when included or not on the order. */
  pagerootMonthly: number;
  /** Aurora fee per month. Zero when included or not on the order. */
  auroraMonthly: number;
  /** Extra storage blocks per month. Never discounted. */
  storageMonthly: number;
  /** What the billing term took off the plan and its add-ons. */
  termSaving: number;
  monthly: number;
  annual: number;
  /** Amount due on this invoice: one month, or twelve months in advance. */
  invoice: number;
  /** Terabytes of object storage on the order, included plus paid. */
  totalTb: number;
  /** Terabytes the plan itself carries. */
  includedTb: number;
  /** True when the plan already carries PageRoot or Aurora. */
  hasPageroot: boolean;
  hasAurora: boolean;
}

/** Plan ids used by links published before the flat tiers replaced per-node plans. */
const LEGACY_IDS: Record<string, PlanId> = {
  bee: 'go',
  'bee-starter': 'starter',
  'bee-production': 'go',
  stack: 'pro',
  cloud: 'pro',
  team: 'pro',
  enterprise: 'max',
};

export function findPlan(id: string | null | undefined): Plan {
  const key = (id && LEGACY_IDS[id]) || id;
  return PLANS.find((p) => p.id === key) ?? PLANS.find((p) => p.id === DEFAULT_CONFIG.planId)!;
}

/* --------------------------------------------------------------------------
 * Queries over the catalogue
 *
 * Everything a page wants to say about the range — which plans a deployment
 * offers, what a tier costs there, which plans carry a module — is derived
 * here rather than written into the copy. Adding, renaming or repricing a plan
 * is then a change to `PLANS` alone.
 * ------------------------------------------------------------------------ */

/** Every plan, cheapest first on this deployment. Cloud-only plans are absent from `self-hosted`. */
export function plansFor(deployment: Deployment): Plan[] {
  return PLANS.filter((p) => deployment === 'cloud' || !p.cloudOnly).sort(
    (a, b) => planPrice(a, deployment) - planPrice(b, deployment),
  );
}

/** The cheapest plan a buyer can start on for this deployment. */
export function entryPlan(deployment: Deployment): Plan {
  return plansFor(deployment)[0];
}

/** The most expensive listed plan for this deployment. Enterprise is not on the list. */
export function topPlan(deployment: Deployment): Plan {
  const list = plansFor(deployment);
  return list[list.length - 1];
}

/** What the range costs on a deployment, and which plans sit at each end. */
export function priceRange(deployment: Deployment): { from: number; to: number; fromPlan: Plan; toPlan: Plan } {
  const fromPlan = entryPlan(deployment);
  const toPlan = topPlan(deployment);
  return {
    from: planPrice(fromPlan, deployment),
    to: planPrice(toPlan, deployment),
    fromPlan,
    toPlan,
  };
}

/** Plans that carry the add-on at no extra cost, in catalogue order. */
export function plansWith(addon: AddonId): Plan[] {
  return PLANS.filter((p) => planIncludes(p.id, addon));
}

/** Plans that can buy the add-on, i.e. do not already have it. */
export function plansBuying(addon: AddonId): Plan[] {
  return PLANS.filter((p) => addonBuyable(p.id, addon));
}

/** Plans where the add-on is simply not offered, bought or bundled. */
export function plansWithout(addon: AddonId): Plan[] {
  return PLANS.filter((p) => !planIncludes(p.id, addon) && !addonBuyable(p.id, addon));
}

/** Plans with a backend of their own, as opposed to shared capacity. */
export function dedicatedPlans(): Plan[] {
  return PLANS.filter((p) => !p.infra.shared);
}

/** Plans running on multi-tenant capacity. */
export function sharedPlans(): Plan[] {
  return PLANS.filter((p) => p.infra.shared);
}

/** Plans that can run on hardware the customer owns. */
export function onPremPlans(): Plan[] {
  return PLANS.filter((p) => !p.cloudOnly);
}

/** The plan the site leads with. Falls back to the dearest listed tier. */
export function featuredPlan(): Plan {
  return PLANS.find((p) => p.featured) ?? topPlan('cloud');
}

/** Plans answered outside business hours. */
export function alwaysOnPlans(): Plan[] {
  return PLANS.filter((p) => SUPPORT[p.id].alwaysOn);
}

/** Plans whose ingest is rate limited rather than unmetered. */
export function bestEffortPlans(): Plan[] {
  return PLANS.filter((p) => p.bestEffort);
}

/** "Pro", "Pro and Max", "Go, Pro and Max" — a list for prose. */
export function planNames(plans: readonly Plan[]): string {
  const names = plans.map((p) => p.name);
  if (names.length === 0) return 'no plan';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** True when the plan carries the add-on at no extra cost. */
export function planIncludes(planId: PlanId, addon: AddonId): boolean {
  return findPlan(planId).includes.includes(addon);
}

/** True when the add-on can be bought on this plan, i.e. it is not already in it. */
export function addonBuyable(planId: PlanId, addon: AddonId): boolean {
  return findAddon(addon).availableOn.includes(planId) && !planIncludes(planId, addon);
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampInt = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)));

/** Clamps a configuration to what its plan allows. */
export function normalize(config: Config): Config {
  const plan = findPlan(config.planId);
  return {
    planId: plan.id,
    deployment: plan.cloudOnly || config.deployment !== 'self-hosted' ? 'cloud' : 'self-hosted',
    dc: config.dc === 'us' ? 'us' : 'eu',
    term: parseTerm(config.term),
    currency: config.currency || 'usd',
    pageroot: addonBuyable(plan.id, 'pageroot') ? Boolean(config.pageroot) : false,
    aurora: addonBuyable(plan.id, 'aurora') ? Boolean(config.aurora) : false,
    storageBlocks: addonBuyable(plan.id, 'storage') ? clampInt(config.storageBlocks, 0, STORAGE.maxBlocks) : 0,
  };
}

export function quote(config: Config): Quote {
  const c = normalize(config);
  const plan = findPlan(c.planId);
  const discount = TERM_DISCOUNT[c.term];
  const onPremCredit = c.deployment === 'self-hosted' ? plan.onPrem : 0;
  const listPlan = plan.price - onPremCredit;
  const listPageroot = c.pageroot ? PAGEROOT.price : 0;
  const listAurora = c.aurora ? AURORA.price : 0;
  const planMonthly = round2(listPlan * (1 - discount));
  const pagerootMonthly = round2(listPageroot * (1 - discount));
  const auroraMonthly = round2(listAurora * (1 - discount));
  const storageMonthly = round2(c.storageBlocks * STORAGE.pricePerBlock);
  const monthly = round2(planMonthly + pagerootMonthly + auroraMonthly + storageMonthly);
  return {
    ...c,
    plan,
    listPlan,
    onPremCredit,
    planMonthly,
    pagerootMonthly,
    auroraMonthly,
    storageMonthly,
    termSaving: round2(listPlan + listPageroot + listAurora - planMonthly - pagerootMonthly - auroraMonthly),
    monthly,
    annual: round2(monthly * 12),
    invoice: round2(c.term === 1 ? monthly : monthly * 12),
    totalTb: plan.includedTb + c.storageBlocks * STORAGE.blockTb,
    includedTb: plan.includedTb,
    hasPageroot: planIncludes(plan.id, 'pageroot') || c.pageroot,
    hasAurora: planIncludes(plan.id, 'aurora') || c.aurora,
  };
}

/** Reads `?plan=&deploy=&dc=&term=&currency=&pageroot=&aurora=&tb=`, as written by `configQuery`. */
export function configFromSearch(search: string): Config {
  const params = new URLSearchParams(search);
  const num = (key: string, fallback: number) => {
    const n = Number.parseInt(params.get(key) ?? '', 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const flag = (key: string) => params.get(key) === '1' || params.get(key) === 'on';
  const currencyParam = params.get('currency');
  const currency = currencyParam === 'eur' || currencyParam === 'usd' ? currencyParam : preferredCurrency();
  if (currencyParam === 'eur' || currencyParam === 'usd') persistCurrency(currencyParam);
  // Links published against the per-node plans said `plan=cloud` for managed.
  const legacyPlan = params.get('plan');
  const deployParam = params.get('deploy');
  const deployment: Deployment =
    deployParam === 'self-hosted' || deployParam === 'cloud'
      ? deployParam
      : legacyPlan === 'stack' || legacyPlan === 'bee'
        ? 'self-hosted'
        : DEFAULT_CONFIG.deployment;
  const plan = findPlan(legacyPlan);
  // `tb=` is total capacity; anything past the plan's allowance is bought in blocks.
  const extraTb = params.has('tb') ? Math.max(0, num('tb', 0) - plan.includedTb) : 0;
  return normalize({
    planId: plan.id,
    deployment,
    dc: params.get('dc') === 'us' ? 'us' : 'eu',
    term: parseTerm(num('term', DEFAULT_CONFIG.term)),
    currency,
    // `seats=` was the old PageRoot user count; any positive number means "on".
    pageroot: flag('pageroot') || num('seats', 0) > 0,
    aurora: flag('aurora'),
    storageBlocks: params.has('blocks') ? num('blocks', 0) : Math.ceil(extraTb / STORAGE.blockTb),
  });
}

export function configQuery(config: Config): string {
  const c = normalize(config);
  return new URLSearchParams({
    plan: c.planId,
    deploy: c.deployment,
    dc: c.dc,
    term: String(c.term),
    currency: c.currency,
    pageroot: c.pageroot ? '1' : '0',
    aurora: c.aurora ? '1' : '0',
    blocks: String(c.storageBlocks),
  }).toString();
}

export function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/**
 * Converts a euro list amount for display. Quote math stays in EUR; USD is
 * marked up and rounded to the dollar, so the price list reads like a price
 * list in both currencies.
 */
export function toDisplayAmount(amountEur: number, currency: Currency): number {
  if (currency !== 'usd') return amountEur;
  const usd = amountEur * USD_MARKUP;
  return usd >= 1 ? Math.round(usd) : usd;
}

export function fxDisclaimer(): string {
  return `The invoice is issued in the currency you pick.`;
}

/** Small counts as words, for prose that should not open on a numeral. */
export function spell(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
}

/** "one node with 4 cores, 32 GB RAM and 500 GB NVMe" — safe mid-sentence. */
export function infraPhrase(plan: Plan): string {
  const { nodes, cores, ramGb, disk, shared } = plan.infra;
  if (shared) return 'multi-tenant capacity on Obstack Cloud';
  const count = nodes === 1 ? 'one node' : `${spell(nodes)} nodes`;
  return `${count} with ${cores} cores, ${ramGb} GB RAM and ${disk}${nodes > 1 ? ' each' : ''}`;
}

/** "16 cores, 64 GB RAM and 8 TB NVMe" — the machine, without the node count. */
export function machinePhrase(plan: Plan): string {
  const { cores, ramGb, disk } = plan.infra;
  return `${cores} cores, ${ramGb} GB RAM and ${disk}`;
}

/** "shared infrastructure", "a dedicated node", "a three-node HA cluster" — safe mid-sentence. */
export function infraShapePhrase(plan: Plan): string {
  const { nodes, shared } = plan.infra;
  if (shared) return 'shared infrastructure';
  if (nodes === 1) return 'a dedicated node, with no HA';
  return `a ${spell(nodes)}-node HA cluster`;
}

/** "One node · 4 cores · 32 GB RAM · 500 GB NVMe", for cards and tables. */
export function infraLine(plan: Plan): string {
  const { nodes, cores, ramGb, disk, shared } = plan.infra;
  if (shared) return 'Multi-tenant capacity on Obstack Cloud';
  const count = nodes === 1 ? 'One node' : `${nodes} nodes`;
  return `${count} · ${cores} cores · ${ramGb} GB RAM · ${disk}${nodes > 1 ? ' each' : ''}`;
}

/** "Single node, no HA" or "Three-node HA cluster". */
export function infraShape(plan: Plan): string {
  const { nodes, ha, shared } = plan.infra;
  if (shared) return 'Shared infrastructure';
  if (nodes === 1) return 'Dedicated node, no HA';
  return `${nodes === 3 ? 'Three' : nodes}-node HA cluster`;
}

export function formatTb(tb: number): string {
  return `${tb.toLocaleString('en-US')} TB`;
}

/** Whole dollars (or euros) when the amount is whole, cents otherwise. */
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

/** A figure that is already in US dollars, such as another vendor's list price. */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/** Both currencies, so the page can switch from `data-currency` without a reload. */
export function dualPrice(amountEur: number): string {
  return `<span class="ob-price"><span class="ob-usd">${formatPrice(amountEur, 'usd')}</span><span class="ob-eur">${formatPrice(amountEur, 'eur')}</span></span>`;
}
