import { useEffect, useState } from 'react';
import {
  BASELINE,
  CURRENCY_EVENT,
  DEFAULT_COMPARE_NODES,
  DEFAULT_CONFIG,
  MAX_COMPARE_NODES,
  configFromSearch,
  configQuery,
  formatPrice,
  formatUsd,
  quote,
  type Config,
  type Currency,
} from '../data/plans';
import { openMailto, url } from '../lib/url';
import ConfigFields, { QuoteSummary, quoteText } from './ConfigFields';
import './checkout.css';

export default function Configurator() {
  const [config, setConfig] = useState<Config>(() =>
    typeof window === 'undefined' ? DEFAULT_CONFIG : configFromSearch(window.location.search),
  );
  // Only drives the side-by-side: the fleet size changes their bill, never ours.
  const [nodes, setNodes] = useState(DEFAULT_COMPARE_NODES);
  const q = quote(config);
  const baseline = BASELINE.perHost * nodes;

  useEffect(() => {
    setConfig(configFromSearch(window.location.search));
    const onCur = (e: Event) => {
      const c = (e as CustomEvent<Currency>).detail;
      if (c !== 'eur' && c !== 'usd') return;
      setConfig((prev) => (prev.currency === c ? prev : { ...prev, currency: c }));
    };
    window.addEventListener(CURRENCY_EVENT, onCur);
    return () => window.removeEventListener(CURRENCY_EVENT, onCur);
  }, []);

  return (
    <div className="co co-embed">
      <div className="co-main">
        <ConfigFields config={config} onChange={setConfig} />
      </div>

      <QuoteSummary q={q} eyebrow="Your quote">
        <a className="btn btn-primary co-pay" href={url(`/buy?${configQuery(config)}`)}>
          Continue to checkout
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            openMailto(
              `Quote: ${q.plan.name}, ${q.deployment === 'cloud' ? 'Obstack Cloud' : 'self-hosted'}`,
              quoteText(q).join('\n'),
            );
          }}
        >
          Send this quote to sales
        </button>

        <div className="co-vs">
          <label className="co-vs-field">
            <span>How many nodes do you run?</span>
            <input
              type="number"
              min={1}
              max={MAX_COMPARE_NODES}
              value={nodes}
              onChange={(e) => setNodes(Math.min(MAX_COMPARE_NODES, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))}
            />
          </label>
          <dl className="mono">
            <div><dt>{BASELINE.vendor} list, {nodes} hosts</dt><dd>{formatUsd(baseline)} / mo</dd></div>
            <div className="ours"><dt>This quote, any fleet size</dt><dd>{formatPrice(q.monthly, q.currency)} / mo</dd></div>
            <p>
              {BASELINE.vendor}: {BASELINE.detail}, at US list in USD. Change the node count and only their figure moves.
            </p>
          </dl>
        </div>
      </QuoteSummary>
    </div>
  );
}
