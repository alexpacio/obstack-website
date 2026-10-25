/** Software entitlement, separate from infrastructure and external providers. */
export const EAGLESRE = {
  status: 'preview',
  launchPrice: 199,
  includedOn: ['pro', 'max'],
  availableOn: ['go'],
  note: 'Preview by request. Production pricing applies only after general availability and an agreed activation.',
} as const;

export const PRODUCT_PRICING = [
  { name: 'Bee', path: '/bee', price: 'Included in every stack plan', note: 'Unlimited observed nodes; no separate agent licence charge.' },
  { name: 'Eagle', path: '/eagle', price: 'Included in every stack plan', note: 'The console, Ask Eagle and Serverless. Model-provider charges are separate.' },
  { name: 'Grafana', path: '/grafana', price: 'Included in every stack plan', note: 'Unlimited users, dashboards, alert rules and Grafana MCP.' },
  { name: 'EagleMCP', path: '/eaglemcp', price: 'Included in every stack plan', note: 'No connector fee or per-tool-call charge. Assistant and model-provider fees are separate.' },
] as const;

export const AI_BILLING = 'Connect your own model endpoint. Model-provider tokens, inference hosting, SMS and phone charges are paid separately to your providers. Obstack does not resell unlimited inference in the stack price.';
