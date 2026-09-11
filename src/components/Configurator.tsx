import { useEffect, useState } from 'react';
import { BASELINE, CURRENCY_EVENT, DEFAULT_CONFIG, configFromSearch, configQuery, formatPrice, quote, type Config, type Currency } from '../data/plans';
import { openMailto, url } from '../lib/url';
import ConfigFields, { QuoteSummary, quoteText } from './ConfigFields';
import './checkout.css';

export default function Configurator() {
  const [config, setConfig] = useState<Config>(() =>
    typeof window === 'undefined' ? DEFAULT_CONFIG : configFromSearch(window.location.search),
  );
  const q = quote(config);
  const baseline = q.nodes * BASELINE.perHost;

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
              `Quote: ${q.plan.name}, ${q.nodes} nodes${q.pagerootUsers > 0 ? `, PageRoot ${q.pagerootUsers}` : ''}${q.aurora ? ', Aurora AI' : ''}`,
              quoteText(q).join('\n'),
            );
          }}
        >
          Send this quote to sales
        </button>
        <dl className="co-vs mono">
          <div><dt>{BASELINE.vendor} list, {q.nodes} hosts</dt><dd>{formatPrice(baseline, q.currency)} / mo</dd></div>
          <div className="ours"><dt>This quote</dt><dd>{formatPrice(q.monthly, q.currency)} / mo</dd></div>
          <p>{BASELINE.vendor}: {BASELINE.detail}.</p>
        </dl>
      </QuoteSummary>
    </div>
  );
}
