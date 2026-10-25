/** Public product catalogue. Retired entries remain available for restoration. */
export const PRODUCTS = [
  { id: 'bee', name: 'Bee', path: '/bee', deletedAt: null },
  { id: 'eagle', name: 'Eagle', path: '/eagle', deletedAt: null },
  { id: 'eaglesre', name: 'EagleSRE', path: '/eaglesre', deletedAt: null },
  { id: 'eaglemcp', name: 'EagleMCP', path: '/eaglemcp', deletedAt: null },
  { id: 'pageroot', name: 'PageRoot', path: '/pageroot', deletedAt: '2026-10-26', replacement: '/eaglesre' },
  { id: 'aurora', name: 'Aurora AI', path: '/aurora', deletedAt: '2026-10-26', replacement: '/eaglesre' },
] as const;

export const ACTIVE_PRODUCTS = PRODUCTS.filter((product) => product.deletedAt === null);
