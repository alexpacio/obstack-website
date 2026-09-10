import { useEffect, useState, type FormEvent } from 'react';
import { DEFAULT_CONFIG, configFromSearch, formatUsd, quote, type Config } from '../data/plans';
import { mailto, url } from '../lib/url';
import ConfigFields, { QuoteSummary, configSteps, quoteText } from './ConfigFields';
import './checkout.css';

type PayMethod = 'card' | 'transfer';

interface Details {
  company: string;
  vat: string;
  billingEmail: string;
  licenseEmail: string;
  country: string;
  customerId: string;
}

const EMPTY: Details = { company: '', vat: '', billingEmail: '', licenseEmail: '', country: 'Italy', customerId: '' };
const COUNTRIES = ['Italy', 'Germany', 'France', 'Spain', 'Switzerland', 'United Kingdom', 'United States', 'Other'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#138BB0" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

export default function Checkout() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [pay, setPay] = useState<PayMethod>('card');
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [sent, setSent] = useState<null | { orderMail: string }>(null);

  const q = quote(config);
  const cloud = q.plan.deployment === 'cloud';
  const step = configSteps(config);
  // A hosted payment link carries a fixed list price, so it only covers orders without discounts or storage.
  const payLink = q.storageTb === 0 && q.volumeSaving === 0 && q.termSaving === 0 ? q.plan.paymentLink : undefined;
  const contactLabel = cloud ? 'Technical contact email' : 'License contact email';
  const idLabel = cloud ? 'Tenant name' : 'Customer ID on the license';

  // Preselect from ?plan=&nodes=&tb=&term= (set by the pricing page).
  useEffect(() => {
    setConfig(configFromSearch(window.location.search));
  }, []);

  const set = (key: keyof Details) => (value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const orderText = [
    ...quoteText(q),
    `Payment: ${pay === 'card' ? 'card' : 'bank transfer (pro-forma invoice)'}`,
    '',
    `Company: ${details.company}`,
    `VAT number: ${details.vat || '-'}`,
    `Country: ${details.country}`,
    `Billing email: ${details.billingEmail}`,
    `${contactLabel}: ${details.licenseEmail}`,
    `${idLabel}: ${details.customerId || '-'}`,
  ].join('\n');

  function validate(): boolean {
    const next: Partial<Record<keyof Details, string>> = {};
    if (!details.company.trim()) next.company = 'Enter the company name.';
    if (!EMAIL.test(details.billingEmail)) next.billingEmail = 'Enter a valid email.';
    if (!EMAIL.test(details.licenseEmail)) next.licenseEmail = 'Enter a valid email.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (pay === 'card' && payLink) {
      const target = new URL(payLink);
      target.searchParams.set('prefilled_email', details.billingEmail);
      window.location.href = target.toString();
      return;
    }

    const subject = `Order: ${q.plan.name}, ${q.nodes} nodes${q.storageTb > 0 ? `, ${q.storageTb} TB` : ''}`;
    const orderMail = mailto(subject, orderText);
    window.location.href = orderMail;
    setSent({ orderMail });
  }

  if (sent) {
    return (
      <div className="wrap co-done-wrap">
        <div className="co-done">
          <div className="co-done-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A1F2E" strokeWidth="2.4" strokeLinecap="square"><path d="M5 12l5 5L19 7" /></svg>
          </div>
          <h1 className="h2">One last step: send the order email.</h1>
          <p className="body-2">
            Your email app opened with the order addressed to info@obstack.it. Send it and we reply with{' '}
            {pay === 'card' ? 'a secure payment link' : 'a pro-forma invoice with our bank details'}. Once payment clears,{' '}
            {cloud
              ? `the OTLP endpoint and Grafana login for your tenant go to ${details.licenseEmail}.`
              : `the signed license for ${q.nodes} nodes goes to ${details.licenseEmail}.`}
          </p>
          <pre className="co-order mono">{orderText}</pre>
          <div className="btn-row">
            <a className="btn btn-dark" href={sent.orderMail}>Open the email again</a>
            <button type="button" className="btn btn-outline" onClick={() => setSent(null)}>Back to checkout</button>
          </div>
          {!cloud && (
            <p className="small">
              When the license arrives, install it with <code className="mono">sudo install -m 600 license.json /etc/obstack-bee/</code>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="wrap co" onSubmit={submit} noValidate>
      <div className="co-main">
        <div className="stack" style={{ gap: 12 }}>
          <div className="eyebrow">Checkout</div>
          <h1 className="h2">Configure your plan and check out.</h1>
        </div>

        <ConfigFields config={config} onChange={setConfig} />

        <fieldset className="co-block">
          <legend><span className="mono">{step + 1}</span> Company and {cloud ? 'tenant' : 'license'}</legend>
          <div className="co-fields">
            <Field label="Company name" value={details.company} onChange={set('company')} error={errors.company} placeholder="Acme S.r.l." autoComplete="organization" required />
            <Field label="VAT number" value={details.vat} onChange={set('vat')} placeholder="IT01234567890" optional />
            <Field label="Billing email" type="email" value={details.billingEmail} onChange={set('billingEmail')} error={errors.billingEmail} placeholder="billing@acme.example" autoComplete="email" required />
            <Field label={contactLabel} type="email" value={details.licenseEmail} onChange={set('licenseEmail')} error={errors.licenseEmail} placeholder="platform@acme.example" required />
            <label className="co-field">
              <span>Country</span>
              <select value={details.country} onChange={(e) => set('country')(e.target.value)}>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <Field label={idLabel} value={details.customerId} onChange={set('customerId')} placeholder="acme-corp" optional />
          </div>
          <p className="small">
            {cloud
              ? 'Tenant credentials go to the technical contact. The tenant name becomes part of your endpoint address.'
              : 'The signed license file goes to the license contact. The customer ID is written into it.'}
          </p>
        </fieldset>

        <fieldset className="co-block">
          <legend><span className="mono">{step + 2}</span> Payment</legend>
          <div className="co-seg" role="radiogroup" aria-label="Payment method">
            <button type="button" role="radio" aria-checked={pay === 'card'} className={pay === 'card' ? 'on' : ''} onClick={() => setPay('card')}>Card</button>
            <button type="button" role="radio" aria-checked={pay === 'transfer'} className={pay === 'transfer' ? 'on' : ''} onClick={() => setPay('transfer')}>Bank transfer</button>
          </div>
          <p className="co-paynote">
            {pay === 'card'
              ? payLink
                ? 'You continue to our payment provider to pay by card. Your order is fulfilled as soon as payment completes.'
                : 'We confirm your order and reply with a secure card payment link. Your order is fulfilled as soon as payment completes.'
              : 'We email a pro-forma invoice with our bank details, payable within 30 days. Your order is fulfilled as soon as the transfer arrives.'}
          </p>
        </fieldset>
      </div>

      <QuoteSummary q={q} eyebrow="Order summary">
        <button type="submit" className="btn btn-primary co-pay">
          {pay === 'card' ? (payLink ? `Pay ${formatUsd(q.annual)}` : `Place order · ${formatUsd(q.annual)}`) : `Request invoice · ${formatUsd(q.annual)}`}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <ul className="co-perks">
          {cloud ? (
            <>
              <li><Check /><span>Tenant in the region you choose, with OTLP endpoint and Grafana login</span></li>
              <li><Check /><span>No meters on ingest, egress, queries or users</span></li>
            </>
          ) : (
            <>
              <li><Check /><span>Signed offline license by email, with .deb, .rpm and Docker downloads</span></li>
              <li><Check /><span>No license server, no machine binding, no phone-home</span></li>
            </>
          )}
          <li><Check /><span>Add nodes or terabytes any time, prorated at your rate</span></li>
          <li><Check /><span>Full refund within 30 days of your first order</span></li>
        </ul>
        <p className="small">
          More than three years, air-gapped delivery or a security review pack? <a href={mailto('Enterprise')}>Ask about Enterprise</a>.
        </p>
        <p className="small co-back">
          <a href={url('/pricing')}>Compare plans</a> · <a href={url('/terms')}>Commercial terms</a>
        </p>
      </QuoteSummary>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  optional?: boolean;
}

function Field({ label, value, onChange, error, type = 'text', placeholder, autoComplete, required, optional }: FieldProps) {
  return (
    <label className={`co-field${error ? ' err' : ''}`}>
      <span>
        {label}
        {optional && <em> optional</em>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <small>{error}</small>}
    </label>
  );
}
