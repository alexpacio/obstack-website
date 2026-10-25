# Product and pricing review — 26 October 2026

These are positioning recommendations implemented in the website, not measured unit economics. The repository contains product capabilities and backend sizing, but no supplier invoices, support utilisation, conversion data or customer contracts. Existing signed orders retain their agreed terms.

## Revised catalogue

Monthly list prices below are in EUR, excluding VAT, before term discounts.

| Plan | Previous cloud | Revised cloud | Revised own infrastructure | Included storage | Support |
| --- | ---: | ---: | ---: | --- | --- |
| Starter | €49 | €49 | Not offered | 1 TB | Best effort |
| Go | €529 | €499 | €399 | 10 TB | Tier 1, next business day |
| Pro | €1,599 | €1,499 | €1,199 | 10 TB | Tier 2, working hours |
| Max | €5,099 | €4,499 | €3,599 | 10 TB | Tier 3, 24/7; HA backend |
| Enterprise | Custom | Custom | Custom | Agreed | Contracted |

Retain the supplied backend shapes. Price the difference between tiers around dedicated capacity, availability and engineering support. Host count alone does not establish whether a backend can sustain a workload; the comparison table is illustrative, not a capacity guarantee.

| Product or extra | Decision |
| --- | --- |
| Bee | Included in every stack plan; unlimited observed nodes. No separate agent fee. Standalone/custom integration contracts remain quoted. |
| Eagle | Included in every stack plan; no second console or user licence. |
| Grafana and Grafana MCP | Included in every stack plan. |
| EagleMCP | Included in every stack plan; no connector or per-tool-call charge. |
| EagleSRE | Preview by request. Proposed production price €199/month flat on Go; included in Pro and Max at launch; unavailable on Starter. Production billing starts only after general availability and an agreed activation. |
| AI models | Customer's model endpoint/provider. Tokens and inference hosting are separate; dedicated managed inference is quoted. |
| SMS and telephone | Customer's provider charges, separately. |
| Additional managed storage | €149 per 10 TB/month, previously €139; not discounted. Starter cannot buy blocks. |
| Professional services | Written estimate, then time and materials. No invented hourly rate without delivery-cost data. |
| Air-gapped, multi-region, custom SLA | Enterprise quote. |

EagleSRE combines the incident and investigation roles previously marketed as separate products. Its production offer replaces two stacking add-on charges. Preserve its preview status because the existing product page says provider delivery remains in acceptance testing. Do not charge a preview as a production pager.

Keep annual billing at 10% off. Reduce the three-year discount from 20% to 15%, billed annually with the agreed price lock, to leave more room for support and supplier inflation. Lower the fixed USD list premium from 25% to 20%. This is a commercial price schedule, not a live exchange-rate conversion. The currency switch, quote, checkout and terms derive from the same catalogue.

## Public market evidence

Sources checked on 26 October 2026. Vendor amounts retain their published currency and billing basis. These offerings differ in scope, allowances, hosting and support; they are not equivalent total-cost quotes.

- [Datadog official price list](https://www.datadoghq.com/pricing/list/): Infrastructure Pro is $15/host/month and base APM is $31/host/month on annual billing. Their sum supports the existing $46 illustrative baseline. Correct the old “APM Pro” label: APM Pro is a different SKU. Logs, indexed spans and other services add charges. Flat pricing becomes more distinctive as a fleet grows, but small estates can still pay less on usage-based competitors.
- [Grafana Cloud pricing](https://grafana.com/pricing/): Pro starts at $19/month plus usage. Application Observability lists $0.025/host-hour, shown as $18/host at 720 hours. Keep that assumption explicit in comparisons. The free tier, included usage and volume discounts mean a linear list-rate illustration is not an actual invoice.
- [SigNoz pricing](https://signoz.io/pricing/): Cloud starts at $49/month including $49 of consumption, with logs/traces at $0.30/GB and metrics at $0.10/million samples. MCP and unlimited teammates are included. Enterprise starts at $4,000/month with cloud, BYOC and supported self-hosted options. This supports a competitive €49 entry and including MCP rather than charging for a connector.
- [incident.io pricing](https://incident.io/pricing): Team incident response is $15/user/month annually, with on-call adding $10/user/month. Basic is free for a single-team workflow. A flat incident product can suit a growing rota, but should not be marketed as cheaper for every team.
- [PagerDuty pricing](https://www.pagerduty.com/pricing/): Professional is $21/user/month annually or $25 monthly, with additional products sold separately. Mature delivery and support have value; EagleSRE's proposed price must be paired with an honest readiness label.
- [Better Stack pricing](https://betterstack.com/pricing): responders are $29/month annually or $34 monthly; AI SRE chat lists $5/million tokens. This supports separating externally incurred inference costs from the software subscription rather than promising unbounded model hosting.
- [Backblaze B2 pricing](https://www.backblaze.com/cloud-storage/pricing): public storage starts at $6.95/TB/month, free transactions and egress up to three times stored capacity; extra egress is charged. €149 per managed 10 TB is a positioning choice with room for operations, not proof of profitability. Obstack's existing all-in egress promise requires its own supplier and traffic cost validation.

## Cost assumptions and practical limits

The revised own-infrastructure credits (€100/€300/€900) are commercial allowances. They need reconciliation against actual servers, redundancy, backup, networking and managed storage before using them as accounting cost estimates. Removing dedicated inference from list plans avoids promising an uncosted GPU service.

As an internal review target, a 60% gross margin permits total monthly delivery costs of €19.60, €199.60, €599.60 and €1,799.60 respectively at list. With the 15% three-year discount those budgets fall to €16.66, €169.66, €509.66 and €1,529.66. These are maximum budgets, not observed costs. Include engineering time, on-call coverage, incident load, provider egress and trial deployments when assessing them. Max's 24/7 response commitment is viable only with a staffed, shared support operation; named or custom coverage remains Enterprise.

The 30-day evaluation now offers the self-hosted Max edition as a Helm chart, with paid Go/Pro/Max activation for the existing installation. See `max-demo-delivery.md` for chart publication and licensing handoff. The refund policy, paid support response matrix and cloud SLA remain as established in the repository. There is no automatic migration or repricing of customer contracts, and no deployment has been published by this change.

## Retired products

PageRoot and Aurora are soft-deleted in `src/data/products.ts`. Their original page sources, comparison component, video catalogue and commercial catalogue are retained under `archive/products`; images and recordings remain in `public`. Legacy product URLs redirect to EagleSRE and are excluded from the sitemap. Retired checkout flags are ignored and never add charges. The live demo shows the retained Grafana recording rather than relabeling footage of retired software.
