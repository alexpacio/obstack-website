/** JSON-LD builders for the structured data Google reads on each page. */

const SITE = 'https://obstack.it';

export interface SoftwareOffer {
  /** EUR list price per unit per month. */
  price: number;
  /** e.g. `per node per month`. */
  unit: string;
}

/**
 * A product page: what the software is, and what a unit of it costs.
 * `path` is the page path, used as the stable node id.
 */
export function softwareSchema(opts: {
  path: string;
  name: string;
  description: string;
  category?: string;
  offers?: SoftwareOffer[];
  sameAs?: string[];
}): Record<string, unknown> {
  const id = `${SITE}${opts.path.replace(/\/+$/, '')}/`;
  return {
    '@type': 'SoftwareApplication',
    '@id': `${id}#software`,
    name: opts.name,
    description: opts.description,
    applicationCategory: opts.category ?? 'DeveloperApplication',
    operatingSystem: 'Linux (Ubuntu 24.04 LTS, 26.04 LTS)',
    url: id,
    publisher: { '@id': `${SITE}/#organization` },
    ...(opts.sameAs ? { sameAs: opts.sameAs } : {}),
    ...(opts.offers && opts.offers.length
      ? {
          offers: opts.offers.map((o) => ({
            '@type': 'Offer',
            price: String(o.price),
            priceCurrency: 'EUR',
            unitText: o.unit,
            availability: 'https://schema.org/InStock',
            url: `${SITE}/pricing/`,
            seller: { '@id': `${SITE}/#organization` },
          })),
        }
      : {}),
  };
}

/** The question-and-answer blocks Google can show as an FAQ rich result. */
export function faqSchema(path: string, faqs: readonly (readonly [string, string])[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE}${path.replace(/\/+$/, '')}/#faq`,
    mainEntity: faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

/** Trail from the home page to this page, for the breadcrumb line in results. */
export function breadcrumbSchema(path: string, name: string): Record<string, unknown> {
  const id = `${SITE}${path.replace(/\/+$/, '')}/`;
  return {
    '@type': 'BreadcrumbList',
    '@id': `${id}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Obstack', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name, item: id },
    ],
  };
}

/** Copy that carries dual-currency markup, reduced to text for structured data. */
export function plainText(html: string): string {
  return html
    // Both currency spans are present in the markup; keep only the USD one.
    .replace(/<span class="ob-eur">.*?<\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
