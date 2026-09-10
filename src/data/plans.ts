export type Deployment = 'self-hosted' | 'cloud';
export type PlanId = 'bee' | 'stack' | 'cloud';
export type Term = 12 | 36;

export interface Plan {
  id: PlanId;
  deployment: Deployment;
  name: string;
  short: string;
  /** USD per node per month on a 12-month term, before volume and term discounts. */
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
  /**
   * Optional hosted payment page (for example a Stripe Payment Link) for plain
   * orders at list price. When set, card checkout continues there; otherwise
   * the order is sent by email.
   */
  paymentLink?: string;
}

export const PLANS: Plan[] = [
  {
    id: 'bee',
    deployment: 'self-hosted',
    name: 'Bee',
    short: 'Bee',
    price: 15,
    minNodes: 1,
    blurb: 'The eBPF agent on its own, exporting to the collector you already run.',
    features: ['HTTP, gRPC, TLS, MySQL, Redis and named Node.js awaits', 'OTLP to any OpenTelemetry collector', 'Email support, next business day'],
    storage: 'none',
    paymentLink: import.meta.env.PUBLIC_PAYMENT_LINK_BEE,
  },
  {
    id: 'stack',
    deployment: 'self-hosted',
    name: 'Obstack Stack',
    short: 'Stack',
    price: 25,
    minNodes: 3,
    blurb: 'The complete stack on your servers, air-gapped sites included.',
    features: ['Bee, Beyla, Vector, Kafka, GreptimeDB, Grafana and Keep', 'Unlimited users, dashboards and alert rules', 'One support contract, P1 answered in 4 business hours'],
    storage: 'optional',
    paymentLink: import.meta.env.PUBLIC_PAYMENT_LINK_STACK,
  },
  {
    id: 'cloud',
    deployment: 'cloud',
    name: 'Obstack Cloud',
    short: 'Cloud',
    price: 39,
    minNodes: 3,
    blurb: 'The same stack, operated by us in the EU. You install the agents; we run the rest.',
    features: ['Managed Vector, GreptimeDB, Grafana and Keep, upgrades included', 'EU only: Milan by default, or Frankfurt, Paris, Ireland', '99.9% uptime SLA, P1 answered in 1 hour, 24/7'],
    storage: 'required',
  },
];

/**
 * Object storage we provision and bill with the plan. IDrive e2 has the lowest
 * list price among S3 providers without egress fees, charges nothing for API
 * calls and has no minimum storage duration, which matters because retention
 * deletes telemetry every day.
 */
export const STORAGE = {
  provider: 'IDrive e2',
  /** USD per TB per month, bucket setup, lifecycle rules and monitoring included. */
  pricePerTb: 7,
  regions: ['Milan', 'Frankfurt', 'Paris', 'Ireland'],
  minTb: 1,
  maxTb: 1000,
};

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

export interface Config {
  planId: PlanId;
  nodes: number;
  /** 0 means the customer brings their own storage (self-hosted Stack only). */
  storageTb: number;
  term: Term;
}

export const DEFAULT_CONFIG: Config = { planId: 'cloud', nodes: 10, storageTb: 2, term: 12 };

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
  const storageTb =
    plan.storage === 'none' ? 0 : clampInt(config.storageTb, plan.storage === 'required' ? STORAGE.minTb : 0, STORAGE.maxTb);
  return {
    planId: plan.id,
    nodes: clampInt(config.nodes, plan.minNodes, MAX_NODES),
    storageTb,
    term: config.term === 36 ? 36 : 12,
  };
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
  const storageMonthly = c.storageTb * STORAGE.pricePerTb;
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

/** Reads `?plan=&nodes=&tb=&term=`, as written by `configQuery`. */
export function configFromSearch(search: string): Config {
  const params = new URLSearchParams(search);
  const num = (key: string, fallback: number) => {
    const n = Number.parseInt(params.get(key) ?? '', 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return normalize({
    planId: findPlan(params.get('plan')).id,
    nodes: num('nodes', DEFAULT_CONFIG.nodes),
    storageTb: num('tb', DEFAULT_CONFIG.storageTb),
    term: num('term', DEFAULT_CONFIG.term) === 36 ? 36 : 12,
  });
}

export function configQuery(config: Config): string {
  const c = normalize(config);
  return new URLSearchParams({ plan: c.planId, nodes: String(c.nodes), tb: String(c.storageTb), term: String(c.term) }).toString();
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

/** Whole dollars when the amount is whole, cents otherwise. */
export function formatUsd(amount: number): string {
  const cents = round2(amount);
  const digits = Number.isInteger(cents) ? 0 : 2;
  return `$${cents.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
