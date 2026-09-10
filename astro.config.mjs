// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://obstack.it',
  integrations: [react()],
  vite: {
    // `astro build` prebundles the production JSX runtime, where jsxDEV is
    // undefined. Exclude it so `astro dev` cannot pick up that stub.
    optimizeDeps: {
      exclude: ['react/jsx-dev-runtime'],
    },
  },
});
