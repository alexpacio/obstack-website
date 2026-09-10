interface ImportMetaEnv {
  /** Optional hosted payment pages (e.g. Stripe Payment Links) for list-price self-hosted orders. */
  readonly PUBLIC_PAYMENT_LINK_BEE?: string;
  readonly PUBLIC_PAYMENT_LINK_STACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
