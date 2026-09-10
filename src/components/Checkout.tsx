import { useEffect, useState, type FormEvent } from 'react';
import { DEFAULT_CONFIG, configFromSearch, formatPrice, quote, type Config } from '../data/plans';
import { openMailto, url } from '../lib/url';
import ConfigFields, { QuoteSummary, configSteps, quoteText } from './ConfigFields';
import './checkout.css';

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
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [sent, setSent] = useState<null | { orderMail: string; email: string }>(null);

  const q = quote(config);
  const cloud = q.plan.deployment === 'cloud';
  const step = configSteps(config);
  const contactLabel = cloud ? 'Technical contact email' : 'License contact email';
  const idLabel = cloud ? 'Tenant name' : 'Customer ID on the license';

  useEffect(() => {
    setConfig(configFromSearch(window.location.search));
  }, []);

  const set = (key: keyof Details) => (value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const orderText = [
    ...quoteText(q),
    'Payment: bank transfer (pro-forma invoice)',
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

    const subject = `Order: ${q.plan.name}, ${q.nodes} nodes${q.storageGb > 0 ? `, ${q.storageGb} GB` : ''}`;
    openMailto(subject, orderText, (orderMail, email) => {
      setSent({ orderMail, email });
    });
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
            Your email app opened with the order addressed to {sent.email || 'us'}. Send it and we reply with a pro-forma invoice with our bank details. Once the transfer arrives,{' '}
            {cloud
              ? `the OTLP endpoint and Grafana login for your tenant go to ${details.licenseEmail}.`
              : `Bee source, updates and Ubuntu packages for ${q.nodes} nodes go to ${details.licenseEmail}.`}
          </p>
          <pre className="co-order mono">{orderText}</pre>
          <div className="btn-row">
            <a className="btn btn-dark" href={sent.orderMail}>Open the email again</a>
            <button type="button" className="btn btn-outline" onClick={() => setSent(null)}>Back to checkout</button>
          </div>
          {!cloud && (
            <p className="small">
              Bee is licensed under the PolyForm Internal Use License. An active subscription is how you get the source and every update.
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
              : 'Source access and Ubuntu packages go to the license contact. The customer ID is how we label the subscription.'}
          </p>
        </fieldset>

        <fieldset className="co-block">
          <legend><span className="mono">{step + 2}</span> Payment</legend>
          <p className="co-paynote">
            We email a pro-forma invoice with our bank details, payable within 30 days. USD prices are 25% above EUR; the invoice is issued in the currency you pick. Your order is fulfilled as soon as the transfer arrives. No card payments accepted.
          </p>
        </fieldset>
      </div>

      <QuoteSummary q={q} eyebrow="Order summary">
        <button type="submit" className="btn btn-primary co-pay">
          Request invoice · {formatPrice(q.annual, q.currency)}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <ul className="co-perks">
          {cloud ? (
            <>
              <li><Check /><span>Tenant in the {q.dc.toUpperCase()} datacenter, with OTLP endpoint and Grafana login</span></li>
              <li><Check /><span>No meters on ingest, egress, queries or users</span></li>
            </>
          ) : (
            <>
              <li><Check /><span>Bee source and updates for the term of the subscription, under PolyForm Internal Use</span></li>
              <li><Check /><span>.deb packages for Ubuntu 24.04 and 26.04, no license server, no phone-home</span></li>
            </>
          )}
          <li><Check /><span>Add nodes or gigabytes any time, prorated at your rate</span></li>
          <li><Check /><span>Full refund within 30 days of your first order</span></li>
        </ul>
        <p className="small">
          More than three years, air-gapped delivery or a security review pack?{' '}
          <a
            className="text-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openMailto('Enterprise');
            }}
          >
            Ask about Enterprise
          </a>.
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
