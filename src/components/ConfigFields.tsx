import { type ReactNode } from 'react';
import {
  ADDONS,
  AURORA,
  DEPLOYMENTS,
  PAGEROOT,
  PLANS,
  RATE_LIMIT,
  STORAGE,
  SUPPORT,
  TERM_DISCOUNT,
  addonBuyable,
  findPlan,
  formatPrice,
  formatTb,
  fxDisclaimer,
  infraLine,
  infraPhrase,
  infraShape,
  invoiceLabel,
  persistCurrency,
  planIncludes,
  planPrice,
  normalize,
  pct,
  termLabel,
  termSavingLabel,
  type Config,
  type Currency,
  type Datacenter,
  type PlanId,
  type Quote,
  type Term,
} from '../data/plans';

/** Number of numbered fieldsets `ConfigFields` renders, so later steps can continue the count. */
export function configSteps(config: Config): number {
  const plan = findPlan(config.planId);
  // Plan, datacenter, currency and billing are always asked.
  let n = 4;
  if (!plan.cloudOnly) n += 1;
  if (addonBuyable(plan.id, 'pageroot') || addonBuyable(plan.id, 'aurora')) n += 1;
  if (addonBuyable(plan.id, 'storage')) n += 1;
  return n;
}

interface Props {
  config: Config;
  onChange: (config: Config) => void;
}

/** Plan, deployment, add-ons and term fieldsets shared by the pricing configurator and checkout. */
export default function ConfigFields({ config, onChange }: Props) {
  const plan = findPlan(config.planId);
  const deployment = DEPLOYMENTS.find((d) => d.id === config.deployment)!;
  const canPageroot = addonBuyable(plan.id, 'pageroot');
  const canAurora = addonBuyable(plan.id, 'aurora');
  const canStorage = addonBuyable(plan.id, 'storage');

  const update = (patch: Partial<Config>) => {
    if (patch.currency) persistCurrency(patch.currency);
    onChange(normalize({ ...config, ...patch }));
  };

  let step = 0;
  const legend = (label: string) => (
    <legend><span className="mono">{++step}</span> {label}</legend>
  );

  return (
    <>
      <fieldset className="co-block">
        {legend('Plan')}
        <div className="co-plans co-plans-4" role="radiogroup" aria-label="Plan">
          {PLANS.map((p) => {
            const on = p.id === plan.id;
            return (
              <button type="button" role="radio" aria-checked={on} key={p.id} className={`co-plan${on ? ' on' : ''}`} onClick={() => update({ planId: p.id })}>
                <span className="co-plan-top">
                  <span className="co-plan-name">{p.name}</span>
                  <span className="co-radio" aria-hidden="true"><span /></span>
                </span>
                <span className="co-plan-price">
                  <strong>{formatPrice(planPrice(p, config.deployment), config.currency)}</strong>
                  <span className="mono">/ month</span>
                </span>
                <span className="co-plan-spec mono">{infraShape(p)}</span>
                <span className="co-plan-blurb">{p.blurb}</span>
              </button>
            );
          })}
        </div>
        <p className="co-note">
          <strong>{infraLine(plan)}.</strong>{' '}
          {plan.infra.note} Nodes, agents, Grafana users, dashboards and alert rules are never counted.
        </p>
        <p className="small">
          Support: {SUPPORT[plan.id].tier}, {SUPPORT[plan.id].channel.toLowerCase()}, {SUPPORT[plan.id].hoursPhrase}. P1 answered in {SUPPORT[plan.id].p1.toLowerCase()}.
        </p>
      </fieldset>

      {plan.cloudOnly ? (
        <fieldset className="co-block">
          {legend('Ingest')}
          <p className="co-paynote">
            <strong>{RATE_LIMIT.short}</strong> {RATE_LIMIT.blurb}
          </p>
        </fieldset>
      ) : (
        <fieldset className="co-block">
          {legend('Deployment')}
          <div className="co-plans co-plans-2" role="radiogroup" aria-label="Deployment">
            {DEPLOYMENTS.map((d) => {
              const on = d.id === config.deployment;
              const price = planPrice(plan, d.id);
              return (
                <button type="button" role="radio" aria-checked={on} key={d.id} className={`co-plan${on ? ' on' : ''}`} onClick={() => update({ deployment: d.id })}>
                  <span className="co-plan-top">
                    <span className="co-plan-name">{d.label}</span>
                    <span className="co-radio" aria-hidden="true"><span /></span>
                  </span>
                  <span className="co-plan-price">
                    <strong>{formatPrice(price, config.currency)}</strong>
                    <span className="mono">/ month</span>
                  </span>
                  <span className="co-plan-spec mono">
                    {d.id === 'cloud'
                      ? 'Hardware included'
                      : `${formatPrice(plan.onPrem, config.currency)} hosting credit`}
                  </span>
                  <span className="co-plan-blurb">
                    {d.id === 'cloud'
                      ? `We provision and run ${infraPhrase(plan)} plus the storage, in the datacenter you pick.`
                      : `You provide ${plan.infra.nodes === 1 ? 'one machine' : `${plan.infra.nodes} machines`} of ${plan.infra.cores} cores, ${plan.infra.ramGb} GB RAM and ${plan.infra.disk}${plan.infra.nodes > 1 ? ' each' : ''}, plus an S3-compatible bucket.`}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="co-paynote">
            {config.deployment === 'self-hosted' ? (
              <>
                <strong>{formatPrice(plan.onPrem, config.currency)} off the list price</strong>, because the{' '}
                {plan.infra.nodes === 1 ? 'node' : 'nodes'} and the bucket are yours — roughly what we would have spent hosting
                this plan. The software, the modules and the support tier are identical. {deployment.note}
              </>
            ) : (
              <>
                <strong>Hardware included.</strong> {deployment.note} Already own machines this size? Switch to your own
                infrastructure and take {formatPrice(plan.onPrem, config.currency)} a month off.
              </>
            )}
          </p>
        </fieldset>
      )}

      {(canPageroot || canAurora) && (
        <fieldset className="co-block">
          {legend('Add-ons')}
          {canPageroot && (
            <Toggle
              name="PageRoot"
              price={formatPrice(PAGEROOT.price, config.currency)}
              on={config.pageroot}
              onChange={(v) => update({ pageroot: v })}
              note={
                config.pageroot
                  ? 'On-call schedules, escalation chains, ChatOps to Slack and Telegram, phone calls and a built-in MCP server. Unlimited on-call users and unlimited incidents: the module is flat, like the plan.'
                  : 'Alertmanager still routes Prometheus alerts. Add PageRoot for on-call schedules, escalation chains, ChatOps and a built-in MCP server. Pro and Max include it.'
              }
            />
          )}
          {canAurora && (
            <Toggle
              name="Aurora AI"
              price={formatPrice(AURORA.price, config.currency)}
              on={config.aurora}
              onChange={(v) => update({ aurora: v })}
              note={
                config.aurora
                  ? `The AI SRE, with unlimited ${AURORA.model} on the shared Obstack endpoint. No per-token meter. Aurora reads Grafana MCP and works incidents through PageRoot MCP. Max runs the same thing on a private, single-tenant model deployment.`
                  : `Add an AI SRE that works incidents through Grafana MCP and PageRoot MCP, with unlimited ${AURORA.model} hosted by Obstack. Max includes it on a private model deployment.`
              }
            />
          )}
        </fieldset>
      )}

      {canStorage && (
        <fieldset className="co-block">
          {legend('Storage')}
          <div className="co-nodes">
            <Stepper
              value={config.storageBlocks}
              min={0}
              max={STORAGE.maxBlocks}
              label={`extra ${STORAGE.blockTb} TB blocks`}
              onChange={(storageBlocks) => update({ storageBlocks })}
            />
            <p className="small">
              Blocks of {STORAGE.blockTb} TB on top of the {formatTb(plan.includedTb)} the plan already includes. Leave it at zero until you need more.
            </p>
          </div>
          <p className="co-paynote">
            <strong>{formatTb(plan.includedTb + config.storageBlocks * STORAGE.blockTb)} of object storage</strong>
            {config.storageBlocks > 0 ? (
              <>
                {' '}— {formatTb(plan.includedTb)} included plus {config.storageBlocks} × {formatTb(STORAGE.blockTb)} at{' '}
                {formatPrice(STORAGE.pricePerBlock, config.currency)} per block per month.
              </>
            ) : (
              <> — all of it included in the plan.</>
            )}{' '}
            Egress and API calls are included. When it fills, the oldest data expires first, so there is never an overage bill.
          </p>
        </fieldset>
      )}

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
          {config.deployment === 'self-hosted'
            ? `Telemetry stays on your network. The region applies to the managed bucket and, if Aurora is on the order, to the ${AURORA.model} endpoint.`
            : `Your backend and its storage stay in the datacenter you pick. EU data stays in the EU.${config.aurora || planIncludes(plan.id, 'aurora') ? ` ${AURORA.model} for Aurora runs there too.` : ''}`}
        </p>
      </fieldset>

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
          Monthly is billed each month at list. Yearly is billed in advance, {pct(TERM_DISCOUNT[12])} off the plan
          {canPageroot || canAurora ? ' and its add-ons' : ''}. A 3-year term is billed yearly, locks those prices, and takes {pct(TERM_DISCOUNT[36])} off.
          {canStorage ? ' Extra storage blocks are not discounted.' : ''}
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

/** One flat add-on: on or off, with the price on the switch itself. */
function Toggle({ name, price, on, onChange, note }: { name: string; price: string; on: boolean; onChange: (on: boolean) => void; note: string }) {
  return (
    <div className="co-toggle">
      <div className="co-toggle-head">
        <div className="co-toggle-id">
          <strong>{name}</strong>
          <span className="mono">{price} / month</span>
        </div>
        <Segmented
          label={name}
          value={on ? 'on' : 'off'}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'on', label: 'Add' },
          ]}
          onChange={(v) => onChange(v === 'on')}
        />
      </div>
      <p className="small">{note}</p>
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

/** Plain-text lines describing a quote, for order and quote emails. */
export function quoteText(q: Quote): string[] {
  const lines: (string | null)[] = [
    `Plan: ${q.plan.name}, ${formatPrice(q.plan.price, q.currency)} per month flat`,
    `Deployment: ${q.deployment === 'cloud' ? `Obstack Cloud, ${q.dc.toUpperCase()} datacenter` : 'your own infrastructure'}`,
    `Infrastructure: ${infraLine(q.plan)}`,
    q.onPremCredit > 0 ? `On-premise credit (hardware is yours): -${formatPrice(q.onPremCredit, q.currency)} per month` : null,
    q.plan.bestEffort ? `Ingest: rate limited, best effort. Excess batches are shed with ${RATE_LIMIT.statuses}; collectors retry.` : 'Ingest: unmetered, no rate limit',
    q.hasPageroot ? `PageRoot: ${planIncludes(q.planId, 'pageroot') ? 'included in the plan' : `${formatPrice(PAGEROOT.price, q.currency)} per month`}` : 'PageRoot: not included',
    q.hasAurora
      ? `Aurora AI: ${planIncludes(q.planId, 'aurora') ? `included in the plan, private ${AURORA.model} deployment` : `${formatPrice(AURORA.price, q.currency)} per month, shared ${AURORA.model} endpoint`}`
      : 'Aurora AI: not included',
    `Object storage: ${formatTb(q.totalTb)}${q.storageBlocks > 0 ? ` (${formatTb(q.includedTb)} included plus ${q.storageBlocks} × ${formatTb(STORAGE.blockTb)} at ${formatPrice(STORAGE.pricePerBlock, q.currency)} per block)` : ' included'}`,
    `Datacenter: ${q.dc.toUpperCase()}`,
    q.termSaving > 0 ? `${termSavingLabel(q.term)} discount: -${formatPrice(q.termSaving, q.currency)} per month` : null,
    `Monthly equivalent: ${formatPrice(q.monthly, q.currency)}`,
    `Billing: ${termLabel(q.term)}`,
    `${invoiceLabel(q.term)}: ${formatPrice(q.invoice, q.currency)} (VAT on invoice)`,
    `Currency: ${q.currency.toUpperCase()}. ${fxDisclaimer()}`,
  ];
  return lines.filter((l): l is string => l !== null);
}

export function QuoteSummary({ q, eyebrow, children }: { q: Quote; eyebrow: string; children: ReactNode }) {
  const included = ADDONS.filter((a) => planIncludes(q.planId, a.id));
  return (
    <aside className="co-summary" aria-label={eyebrow}>
      <div className="co-sum-head">
        <span className="eyebrow">{eyebrow}</span>
        <strong>{q.plan.name}</strong>
      </div>
      <dl className="co-lines mono">
        <div><dt>{q.plan.name}, flat</dt><dd>{formatPrice(q.plan.price, q.currency)} / mo</dd></div>
        {q.onPremCredit > 0 && (
          <div className="save"><dt>Your own hardware</dt><dd>−{formatPrice(q.onPremCredit, q.currency)} / mo</dd></div>
        )}
        {q.pagerootMonthly > 0 && <div><dt>PageRoot</dt><dd>{formatPrice(PAGEROOT.price, q.currency)} / mo</dd></div>}
        {q.auroraMonthly > 0 && <div><dt>Aurora AI</dt><dd>{formatPrice(AURORA.price, q.currency)} / mo</dd></div>}
        {included.map((a) => (
          <div key={a.id}><dt>{a.name}</dt><dd>included</dd></div>
        ))}
        {q.termSaving > 0 && <div className="save"><dt>{termSavingLabel(q.term)}</dt><dd>−{formatPrice(q.termSaving, q.currency)} / mo</dd></div>}
        {q.storageBlocks > 0 && (
          <div>
            <dt>Storage, {q.storageBlocks} × {formatTb(STORAGE.blockTb)}</dt>
            <dd>{formatPrice(q.storageMonthly, q.currency)} / mo</dd>
          </div>
        )}
        <div className="sum"><dt>Monthly equivalent</dt><dd>{formatPrice(q.monthly, q.currency)}</dd></div>
        <div><dt>Nodes and ingest</dt><dd>{q.plan.bestEffort ? 'best effort' : 'unlimited'}</dd></div>
        <div><dt>Object storage</dt><dd>{formatTb(q.totalTb)}</dd></div>
        <div><dt>Runs on</dt><dd>{q.deployment === 'cloud' ? 'Obstack Cloud' : 'your hardware'}</dd></div>
        <div><dt>Datacenter</dt><dd>{q.dc.toUpperCase()}</dd></div>
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
