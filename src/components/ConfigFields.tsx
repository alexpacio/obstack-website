import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  MAX_NODES,
  AURORA,
  PAGEROOT,
  PLANS,
  STORAGE,
  TERM_DISCOUNT,
  allowsAurora,
  allowsPageroot,
  findPlan,
  formatGb,
  formatPrice,
  fxDisclaimer,
  invoiceLabel,
  needsDatacenter,
  normalize,
  persistCurrency,
  pagerootUnitPrice,
  pct,
  termLabel,
  termSavingLabel,
  volumeBands,
  type Config,
  type Currency,
  type Datacenter,
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
    note: 'On your servers. Setup, updates, rollout and monitoring of the infrastructure are included. Custom Grafana dashboards, alerts and similar are Professional Services, quoted in advance. Bee and PageRoot ship under a license key for the first month; after you sign the PolyForm Internal Use agreement, git access to the source. Air-gapped delivery is quoted as Enterprise.',
  },
  {
    id: 'cloud',
    label: 'Obstack Cloud',
    plan: 'cloud',
    note: 'You install the agents. We run the backend in the EU or US datacenter you pick. Setup, updates, rollout and monitoring of the infrastructure are included. Custom Grafana dashboards, alerts and similar are Professional Services, quoted in advance.',
  },
];

/** Stops on the storage slider; the number field accepts any whole GB. */
const GB_STEPS = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000, 150000, 250000, 500000, 750000, 1000000];
const RETENTION_DAYS = [7, 15, 30, 90, 180, 365];

function stepIndex(gb: number): number {
  let i = 0;
  while (i < GB_STEPS.length - 1 && GB_STEPS[i + 1] <= gb) i++;
  return i;
}

/** Number of numbered fieldsets `ConfigFields` renders, so later steps can continue the count. */
export function configSteps(config: Config): number {
  const plan = findPlan(config.planId);
  let n = 4;
  if (plan.storage !== 'none') n += 1;
  if (needsDatacenter(config)) n += 1;
  if (allowsPageroot(plan.id)) n += 1;
  if (allowsAurora(plan.id)) n += 1;
  return n;
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
  const managed = config.storageGb > 0;
  const pagerootOn = config.pagerootUsers > 0;
  // Remembers the chosen size while storage is switched off or the plan has none.
  const [lastGb, setLastGb] = useState(config.storageGb || 2000);
  const [lastSeats, setLastSeats] = useState(config.pagerootUsers || PAGEROOT.defaultUsers);

  const update = (patch: Partial<Config>) => {
    if (patch.currency) persistCurrency(patch.currency);
    onChange(normalize({ ...config, ...patch }));
  };
  const setGb = (gb: number) => {
    const next = Math.max(STORAGE.minGb, gb);
    setLastGb(next);
    update({ storageGb: next });
  };
  const setPlan = (planId: PlanId) => update({ planId, storageGb: config.storageGb || lastGb });

  let step = 0;
  const legend = (label: string) => (
    <legend><span className="mono">{++step}</span> {label}</legend>
  );

  const fill = (stepIndex(config.storageGb) / (GB_STEPS.length - 1)) * 100;

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
                  <strong>{formatPrice(p.price, config.currency)}</strong>
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
        <p className="co-note">
          Volume pricing is graduated: nodes {volumeBands().join(', ')}
          {allowsPageroot(plan.id) ? '. The same bands apply to PageRoot seats.' : '.'}
        </p>
      </fieldset>

      {allowsPageroot(plan.id) && (
        <fieldset className="co-block">
          {legend('PageRoot')}
          <Segmented
            label="PageRoot"
            value={pagerootOn ? 'on' : 'off'}
            options={[
              { value: 'off', label: 'Without PageRoot' },
              { value: 'on', label: 'Add PageRoot' },
            ]}
            onChange={(v) => {
              if (v === 'on') {
                const seats = lastSeats || PAGEROOT.defaultUsers;
                setLastSeats(seats);
                update({ pagerootUsers: seats });
              } else {
                update({ pagerootUsers: 0 });
              }
            }}
          />
          {pagerootOn ? (
            <>
              <div className="co-nodes">
                <Stepper
                  value={config.pagerootUsers}
                  min={PAGEROOT.minUsers}
                  max={PAGEROOT.maxUsers}
                  label="on-call users"
                  onChange={(pagerootUsers) => {
                    setLastSeats(pagerootUsers);
                    update({ pagerootUsers });
                  }}
                />
                <p className="small">
                  One seat per person who can be on a schedule or receive a page. Stakeholders who only watch ChatOps are free.
                </p>
              </div>
              <p className="co-paynote">
                <strong>
                  {config.pagerootUsers} on-call {config.pagerootUsers === 1 ? 'user' : 'users'} at{' '}
                  {formatPrice(pagerootUnitPrice(plan.id), config.currency)}
                </strong>{' '}
                per user per month list. {plan.deployment === 'cloud' ? 'We run PageRoot next to Grafana in your datacenter.' : 'Runs on your servers, next to Grafana and Alertmanager.'} Schedules, escalations, ChatOps and the MCP server are included. No extra fee per incident.
              </p>
            </>
          ) : (
            <p className="co-paynote">
              Alertmanager still routes Prometheus alerts. Add PageRoot when you want on-call schedules, escalation chains, ChatOps and a built-in MCP server. {formatPrice(pagerootUnitPrice(plan.id), config.currency)} per on-call user per month on this deployment.
            </p>
          )}
        </fieldset>
      )}

      {allowsAurora(plan.id) && (
        <fieldset className="co-block">
          {legend('Aurora AI')}
          <Segmented
            label="Aurora AI"
            value={config.aurora ? 'on' : 'off'}
            options={[
              { value: 'off', label: 'Without Aurora' },
              { value: 'on', label: 'Add Aurora' },
            ]}
            onChange={(v) => update({ aurora: v === 'on' })}
          />
          {config.aurora ? (
            <p className="co-paynote">
              <strong>
                Aurora AI + unlimited {AURORA.model} at {formatPrice(AURORA.price, config.currency)}
              </strong>{' '}
              per month list. The model is hosted by Obstack, with no per-token meter, for Aurora investigations on this subscription. Aurora reads Grafana MCP and works incidents through PageRoot MCP. Prompts go to {AURORA.model} in the datacenter you pick; telemetry stays in GreptimeDB.
            </p>
          ) : (
            <p className="co-paynote">
              Add Aurora when you want an AI SRE bundled with unlimited {AURORA.model}, hosted by Obstack.{' '}
              {formatPrice(AURORA.price, config.currency)} per month on Stack and Cloud. Not available with Bee alone. Your own model, or an air-gapped one, is quoted as Enterprise.
            </p>
          )}
        </fieldset>
      )}

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
              onChange={(v) => (v === 'managed' ? setGb(lastGb) : update({ storageGb: 0 }))}
            />
          )}
          {managed ? (
            <>
              <div className="co-range">
                <input
                  type="range"
                  min={0}
                  max={GB_STEPS.length - 1}
                  step={1}
                  value={stepIndex(config.storageGb)}
                  aria-label="Storage in gigabytes"
                  aria-valuetext={formatGb(config.storageGb)}
                  style={{ '--fill': `${fill}%` } as CSSProperties}
                  onChange={(e) => setGb(GB_STEPS[Number(e.target.value)])}
                />
                <label className="co-tb">
                  <input
                    className="mono"
                    type="number"
                    min={STORAGE.minGb}
                    max={STORAGE.maxGb}
                    value={config.storageGb}
                    aria-label="Gigabytes"
                    onChange={(e) => setGb(Number.parseInt(e.target.value, 10) || STORAGE.minGb)}
                  />
                  <span className="mono">GB</span>
                </label>
              </div>
              <p className="co-paynote">
                <strong>{formatGb(config.storageGb)} of Obstack storage</strong>, {formatPrice(config.storageGb * STORAGE.pricePerGb, config.currency)} per month
                at {formatPrice(STORAGE.pricePerGb, config.currency)} per GB. Egress and API calls included. When it fills, the oldest data expires first, so there is never an overage bill.
              </p>
              <Estimator nodes={config.nodes} onUse={setGb} />
            </>
          ) : (
            <p className="co-paynote">
              GreptimeDB writes to any S3-compatible bucket or local disk you run, so storage stays off the invoice. You can add a managed
              bucket at any time.
            </p>
          )}
        </fieldset>
      )}

      {needsDatacenter(config) && (
        <fieldset className="co-block">
          {legend('Datacenter')}
          <Segmented
            label="Datacenter"
            value={config.dc}
            options={[
              { value: 'eu', label: 'EU' },
              { value: 'us', label: 'US' },
            ]}
            onChange={(v) => update({ dc: v as Datacenter })}
          />
          <p className="small">
            {config.aurora && plan.storage !== 'required' && config.storageGb === 0
              ? `${AURORA.model} for Aurora runs in the datacenter you pick. EU prompts stay in the EU.`
              : `Telemetry and managed storage stay in the datacenter you pick. EU data stays in the EU.${config.aurora ? ` ${AURORA.model} for Aurora runs there too.` : ''}`}
          </p>
        </fieldset>
      )}

      <fieldset className="co-block">
        {legend('Currency')}
        <Segmented
          label="Currency"
          value={config.currency}
          options={[
            { value: 'usd', label: 'USD ($)' },
            { value: 'eur', label: 'EUR (€)' },
          ]}
          onChange={(v) => update({ currency: v as Currency })}
        />
        <p className="small">Defaulted from your browser language and timezone. {fxDisclaimer()}</p>
      </fieldset>

      <fieldset className="co-block">
        {legend('Billing')}
        <Segmented
          label="Billing"
          className="co-seg-3"
          value={String(config.term)}
          options={[
            { value: '1', label: 'Monthly' },
            { value: '12', label: `Yearly · ${pct(TERM_DISCOUNT[12])}` },
            { value: '36', label: `3 years · ${pct(TERM_DISCOUNT[36])}` },
          ]}
          onChange={(v) => update({ term: Number(v) as Term })}
        />
        <p className="small">
          Monthly is billed each month at list. Yearly is billed in advance, {pct(TERM_DISCOUNT[12])} off node
          {allowsPageroot(plan.id) ? ' and PageRoot' : ''} fees. A 3-year term is billed yearly, locks those unit prices, and takes {pct(TERM_DISCOUNT[36])} off.
          {' '}Storage{allowsAurora(plan.id) ? ' and Aurora' : ''} are not discounted.
        </p>
      </fieldset>
    </>
  );
}

function Segmented<T extends string>({ label, value, options, onChange, className }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; className?: string }) {
  return (
    <div className={['co-seg', className].filter(Boolean).join(' ')} role="radiogroup" aria-label={label}>
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

function Estimator({ nodes, onUse }: { nodes: number; onUse: (gb: number) => void }) {
  // Kept as text so decimals can be typed without the field rewriting itself.
  const [gbText, setGbText] = useState('1');
  const [days, setDays] = useState(30);
  const perDay = Math.max(0.1, Number.parseFloat(gbText) || 0.1);
  const gb = Math.max(STORAGE.minGb, Math.ceil(nodes * perDay * days));

  return (
    <details className="co-est">
      <summary>Not sure how many gigabytes? Estimate from retention</summary>
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
        <span className="mono">{nodes} nodes × {perDay} GB × {days} days ≈ <strong>{formatGb(gb)}</strong></span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onUse(gb)}>Use {formatGb(gb)}</button>
      </div>
      <p className="small">Stored GB is the compressed size on disk. The best input is your current backend's daily volume per host.</p>
    </details>
  );
}

/** Plain-text lines describing a quote, for order and quote emails. */
export function quoteText(q: Quote): string[] {
  const lines: (string | null)[] = [
    `Plan: ${q.plan.name} (${q.plan.deployment === 'cloud' ? `managed cloud, ${q.dc.toUpperCase()} datacenter` : 'self-hosted'})`,
    `Nodes: ${q.nodes} at ${formatPrice(q.plan.price, q.currency)} per node per month list`,
    q.volumeSaving > 0 ? `Volume discount: -${formatPrice(q.volumeSaving, q.currency)} per month` : null,
    q.termSaving > 0 ? `${termSavingLabel(q.term)} discount on nodes: -${formatPrice(q.termSaving, q.currency)} per month` : null,
    q.pagerootUsers > 0
      ? `PageRoot: ${q.pagerootUsers} on-call ${q.pagerootUsers === 1 ? 'user' : 'users'} at ${formatPrice(pagerootUnitPrice(q.planId), q.currency)} per user per month list`
      : allowsPageroot(q.planId)
        ? 'PageRoot: not included'
        : null,
    q.pagerootVolumeSaving > 0 ? `PageRoot volume discount: -${formatPrice(q.pagerootVolumeSaving, q.currency)} per month` : null,
    q.pagerootTermSaving > 0 ? `${termSavingLabel(q.term)} discount on PageRoot: -${formatPrice(q.pagerootTermSaving, q.currency)} per month` : null,
    q.aurora
      ? `Aurora AI: ${AURORA.model} unlimited, hosted by Obstack, ${formatPrice(AURORA.price, q.currency)} per month list`
      : allowsAurora(q.planId)
        ? 'Aurora AI: not included'
        : null,
    q.plan.storage === 'none'
      ? null
      : `Storage: ${q.storageGb > 0 ? `${formatGb(q.storageGb)} of Obstack storage at ${formatPrice(STORAGE.pricePerGb, q.currency)} per GB per month` : 'customer-provided'}`,
    needsDatacenter(q) ? `Datacenter: ${q.dc.toUpperCase()}` : null,
    `Monthly equivalent: ${formatPrice(q.monthly, q.currency)}`,
    `Billing: ${termLabel(q.term)}`,
    `${invoiceLabel(q.term)}: ${formatPrice(q.invoice, q.currency)} (VAT on invoice)`,
    `Currency: ${q.currency.toUpperCase()}. ${fxDisclaimer()}`,
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
        <div><dt>{q.nodes} nodes × {formatPrice(q.plan.price, q.currency)}</dt><dd>{formatPrice(q.listNodes, q.currency)} / mo</dd></div>
        {q.volumeSaving > 0 && <div className="save"><dt>Volume discount</dt><dd>−{formatPrice(q.volumeSaving, q.currency)} / mo</dd></div>}
        {q.termSaving > 0 && <div className="save"><dt>{termSavingLabel(q.term)}, nodes</dt><dd>−{formatPrice(q.termSaving, q.currency)} / mo</dd></div>}
        {q.pagerootUsers > 0 && (
          <div>
            <dt>PageRoot, {q.pagerootUsers} × {formatPrice(pagerootUnitPrice(q.planId), q.currency)}</dt>
            <dd>{formatPrice(q.listPageroot, q.currency)} / mo</dd>
          </div>
        )}
        {q.pagerootVolumeSaving > 0 && <div className="save"><dt>PageRoot volume</dt><dd>−{formatPrice(q.pagerootVolumeSaving, q.currency)} / mo</dd></div>}
        {q.pagerootTermSaving > 0 && <div className="save"><dt>{termSavingLabel(q.term)}, PageRoot</dt><dd>−{formatPrice(q.pagerootTermSaving, q.currency)} / mo</dd></div>}
        {q.aurora && (
          <div>
            <dt>Aurora AI, {AURORA.model}</dt>
            <dd>{formatPrice(q.auroraMonthly, q.currency)} / mo</dd>
          </div>
        )}
        {q.plan.storage !== 'none' && (
          <div>
            <dt>{q.storageGb > 0 ? `Storage, ${formatGb(q.storageGb)} × ${formatPrice(STORAGE.pricePerGb, q.currency)}` : 'Storage'}</dt>
            <dd>{q.storageGb > 0 ? `${formatPrice(q.storageMonthly, q.currency)} / mo` : 'your own'}</dd>
          </div>
        )}
        <div className="sum"><dt>Monthly equivalent</dt><dd>{formatPrice(q.monthly, q.currency)}</dd></div>
        <div><dt>Effective per node</dt><dd>{formatPrice(q.perNode, q.currency)} / mo</dd></div>
        {needsDatacenter(q) && <div><dt>Datacenter</dt><dd>{q.dc.toUpperCase()}</dd></div>}
        <div><dt>Billing</dt><dd>{termLabel(q.term)}</dd></div>
        <div><dt>VAT</dt><dd>on invoice</dd></div>
      </dl>
      <div className="co-total">
        <span>{invoiceLabel(q.term)}</span>
        <strong>{formatPrice(q.invoice, q.currency)}</strong>
      </div>
      <p className="co-fx">{fxDisclaimer()}</p>
      <div className="co-actions">{children}</div>
    </aside>
  );
}
