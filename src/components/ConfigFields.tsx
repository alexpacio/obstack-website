import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  MAX_NODES,
  PLANS,
  STORAGE,
  TERM_DISCOUNT,
  findPlan,
  formatUsd,
  normalize,
  pct,
  volumeBands,
  type Config,
  type Deployment,
  type PlanId,
  type Quote,
  type Term,
} from '../data/plans';

const DEPLOYMENTS: { id: Deployment; label: string; plan: PlanId; note: string }[] = [
  {
    id: 'self-hosted',
    label: 'Self-hosted',
    plan: 'stack',
    note: 'Runs on your servers, air-gapped sites included, under an offline signed license. You run the backend.',
  },
  {
    id: 'cloud',
    label: 'Obstack Cloud',
    plan: 'cloud',
    note: `We run and upgrade the backend in the EU; you install the agents. Data stays in ${STORAGE.regions[0]} unless you pick another EU region.`,
  },
];

/** Stops on the storage slider; the number field accepts any whole TB. */
const TB_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000];
const RETENTION_DAYS = [7, 15, 30, 90, 180, 365];

function stepIndex(tb: number): number {
  let i = 0;
  while (i < TB_STEPS.length - 1 && TB_STEPS[i + 1] <= tb) i++;
  return i;
}

/** Number of numbered fieldsets `ConfigFields` renders, so later steps can continue the count. */
export function configSteps(config: Config): number {
  return findPlan(config.planId).storage === 'none' ? 3 : 4;
}

interface Props {
  config: Config;
  onChange: (config: Config) => void;
}

/** Plan, nodes, storage and term fieldsets shared by the pricing configurator and checkout. */
export default function ConfigFields({ config, onChange }: Props) {
  const plan = findPlan(config.planId);
  const plans = PLANS.filter((p) => p.deployment === plan.deployment);
  const deployment = DEPLOYMENTS.find((d) => d.id === plan.deployment)!;
  const managed = config.storageTb > 0;
  // Remembers the chosen size while storage is switched off or the plan has none.
  const [lastTb, setLastTb] = useState(config.storageTb || 2);

  const update = (patch: Partial<Config>) => onChange(normalize({ ...config, ...patch }));
  const setTb = (tb: number) => {
    const next = Math.max(STORAGE.minTb, tb);
    setLastTb(next);
    update({ storageTb: next });
  };
  const setPlan = (planId: PlanId) => update({ planId, storageTb: config.storageTb || lastTb });

  let step = 0;
  const legend = (label: string) => (
    <legend><span className="mono">{++step}</span> {label}</legend>
  );

  const fill = (stepIndex(config.storageTb) / (TB_STEPS.length - 1)) * 100;

  return (
    <>
      <fieldset className="co-block">
        {legend('Deployment and plan')}
        <Segmented
          label="Deployment"
          value={plan.deployment}
          options={DEPLOYMENTS.map((d) => ({ value: d.id, label: d.label }))}
          onChange={(d) => d !== plan.deployment && setPlan(DEPLOYMENTS.find((x) => x.id === d)!.plan)}
        />
        <div className={`co-plans co-plans-${plans.length}`} role="radiogroup" aria-label="Plan">
          {plans.map((p) => {
            const on = p.id === plan.id;
            return (
              <button type="button" role="radio" aria-checked={on} key={p.id} className={`co-plan${on ? ' on' : ''}`} onClick={() => setPlan(p.id)}>
                <span className="co-plan-top">
                  <span className="co-plan-name">{p.name}</span>
                  <span className="co-radio" aria-hidden="true"><span /></span>
                </span>
                <span className="co-plan-price">
                  <strong>{formatUsd(p.price)}</strong>
                  <span className="mono">/ node / mo</span>
                </span>
                <span className="co-plan-blurb">{p.blurb}</span>
              </button>
            );
          })}
        </div>
        <p className="small">{deployment.note}</p>
      </fieldset>

      <fieldset className="co-block">
        {legend('Nodes')}
        <div className="co-nodes">
          <Stepper value={config.nodes} min={plan.minNodes} max={MAX_NODES} label="nodes" onChange={(nodes) => update({ nodes })} />
          <p className="small">
            One node per Linux host running the agent. In Kubernetes, count worker nodes, not pods.
            {plan.minNodes > 1 && ` ${plan.name} starts at ${plan.minNodes} nodes.`}
          </p>
        </div>
        <p className="co-note">Volume pricing is graduated: nodes {volumeBands().join(', ')}.</p>
      </fieldset>

      {plan.storage !== 'none' && (
        <fieldset className="co-block">
          {legend('Storage')}
          {plan.storage === 'optional' && (
            <Segmented
              label="Storage"
              value={managed ? 'managed' : 'own'}
              options={[
                { value: 'managed', label: 'Managed bucket' },
                { value: 'own', label: 'Your own storage' },
              ]}
              onChange={(v) => (v === 'managed' ? setTb(lastTb) : update({ storageTb: 0 }))}
            />
          )}
          {managed ? (
            <>
              <div className="co-range">
                <input
                  type="range"
                  min={0}
                  max={TB_STEPS.length - 1}
                  step={1}
                  value={stepIndex(config.storageTb)}
                  aria-label="Storage in terabytes"
                  aria-valuetext={`${config.storageTb} TB`}
                  style={{ '--fill': `${fill}%` } as CSSProperties}
                  onChange={(e) => setTb(TB_STEPS[Number(e.target.value)])}
                />
                <label className="co-tb">
                  <input
                    className="mono"
                    type="number"
                    min={STORAGE.minTb}
                    max={STORAGE.maxTb}
                    value={config.storageTb}
                    aria-label="Terabytes"
                    onChange={(e) => setTb(Number.parseInt(e.target.value, 10) || STORAGE.minTb)}
                  />
                  <span className="mono">TB</span>
                </label>
              </div>
              <p className="co-paynote">
                <strong>{config.storageTb} TB on {STORAGE.provider}</strong>, {formatUsd(config.storageTb * STORAGE.pricePerTb)} per month at{' '}
                {formatUsd(STORAGE.pricePerTb)} per TB. No egress, API or early-deletion fees. When it fills, the oldest data expires first, so
                there is never an overage bill. EU regions: {STORAGE.regions.join(', ')}.
              </p>
              <Estimator nodes={config.nodes} onUse={setTb} />
            </>
          ) : (
            <p className="co-paynote">
              GreptimeDB writes to any S3-compatible bucket or local disk you run, so storage stays off the invoice. You can add a managed
              bucket at any time.
            </p>
          )}
        </fieldset>
      )}

      <fieldset className="co-block">
        {legend('Term')}
        <Segmented
          label="Term"
          value={String(config.term)}
          options={[
            { value: '12', label: '1 year' },
            { value: '36', label: `3 years · ${pct(TERM_DISCOUNT[36])} off` },
          ]}
          onChange={(v) => update({ term: Number(v) as Term })}
        />
        <p className="small">Billed yearly in advance. A 3-year term locks your per-node price; its discount applies to node fees, not storage.</p>
      </fieldset>
    </>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="co-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button type="button" role="radio" key={o.value} aria-checked={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, min, max, label, onChange }: { value: number; min: number; max: number; label: string; onChange: (value: number) => void }) {
  return (
    <div className="co-stepper">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M5 12h14" /></svg>
      </button>
      <input
        className="mono"
        type="number"
        min={min}
        max={max}
        value={value}
        aria-label={`Number of ${label}`}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || min)}
      />
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M5 12h14M12 5v14" /></svg>
      </button>
    </div>
  );
}

function Estimator({ nodes, onUse }: { nodes: number; onUse: (tb: number) => void }) {
  // Kept as text so decimals can be typed without the field rewriting itself.
  const [gbText, setGbText] = useState('1');
  const [days, setDays] = useState(30);
  const gb = Math.max(0.1, Number.parseFloat(gbText) || 0.1);
  const tb = Math.max(STORAGE.minTb, Math.ceil((nodes * gb * days) / 1000));

  return (
    <details className="co-est">
      <summary>Not sure how many terabytes? Estimate from retention</summary>
      <div className="co-est-body">
        <label className="co-field">
          <span>Stored GB per node per day</span>
          <input type="number" min={0.1} step={0.1} inputMode="decimal" value={gbText} onChange={(e) => setGbText(e.target.value)} />
        </label>
        <label className="co-field">
          <span>Retention</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {RETENTION_DAYS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </label>
      </div>
      <div className="co-est-out">
        <span className="mono">{nodes} nodes × {gb} GB × {days} days ≈ <strong>{tb} TB</strong></span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onUse(tb)}>Use {tb} TB</button>
      </div>
      <p className="small">Stored GB is the compressed size on disk. The best input is your current backend's daily volume per host.</p>
    </details>
  );
}

/** Plain-text lines describing a quote, for order and quote emails. */
export function quoteText(q: Quote): string[] {
  const lines: (string | null)[] = [
    `Plan: ${q.plan.name} (${q.plan.deployment === 'cloud' ? 'managed cloud, EU' : 'self-hosted'})`,
    `Nodes: ${q.nodes} at ${formatUsd(q.plan.price)} per node per month list`,
    q.volumeSaving > 0 ? `Volume discount: -${formatUsd(q.volumeSaving)} per month` : null,
    q.termSaving > 0 ? `3-year term discount: -${formatUsd(q.termSaving)} per month` : null,
    q.plan.storage === 'none'
      ? null
      : `Storage: ${q.storageTb > 0 ? `${q.storageTb} TB on ${STORAGE.provider} at ${formatUsd(STORAGE.pricePerTb)} per TB per month` : 'customer-provided'}`,
    `Monthly equivalent: ${formatUsd(q.monthly)}`,
    `Term: ${q.term} months, billed yearly`,
    `Billed yearly: ${formatUsd(q.annual)} (VAT on invoice)`,
  ];
  return lines.filter((l): l is string => l !== null);
}

export function QuoteSummary({ q, eyebrow, children }: { q: Quote; eyebrow: string; children: ReactNode }) {
  return (
    <aside className="co-summary" aria-label={eyebrow}>
      <div className="co-sum-head">
        <span className="eyebrow">{eyebrow}</span>
        <strong>{q.plan.name}</strong>
      </div>
      <dl className="co-lines mono">
        <div><dt>{q.nodes} nodes × {formatUsd(q.plan.price)}</dt><dd>{formatUsd(q.listNodes)} / mo</dd></div>
        {q.volumeSaving > 0 && <div className="save"><dt>Volume discount</dt><dd>−{formatUsd(q.volumeSaving)} / mo</dd></div>}
        {q.termSaving > 0 && <div className="save"><dt>3-year term</dt><dd>−{formatUsd(q.termSaving)} / mo</dd></div>}
        {q.plan.storage !== 'none' && (
          <div>
            <dt>{q.storageTb > 0 ? `Storage, ${q.storageTb} TB × ${formatUsd(STORAGE.pricePerTb)}` : 'Storage'}</dt>
            <dd>{q.storageTb > 0 ? `${formatUsd(q.storageMonthly)} / mo` : 'your own'}</dd>
          </div>
        )}
        <div className="sum"><dt>Monthly equivalent</dt><dd>{formatUsd(q.monthly)}</dd></div>
        <div><dt>Effective per node</dt><dd>{formatUsd(q.perNode)} / mo</dd></div>
        <div><dt>Term</dt><dd>{q.term === 36 ? '3 years' : '12 months'}</dd></div>
        <div><dt>VAT</dt><dd>on invoice</dd></div>
      </dl>
      <div className="co-total">
        <span>Billed yearly</span>
        <strong>{formatUsd(q.annual)}</strong>
      </div>
      <div className="co-actions">{children}</div>
    </aside>
  );
}
