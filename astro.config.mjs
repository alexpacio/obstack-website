// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://obstack.it',
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      // /buy is a checkout funnel, not a landing page: keep it out of the index.
      filter: (page) => !page.includes('/buy'),
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        if (item.url === 'https://obstack.it/') item.priority = 1.0;
        else if (/\/(pricing|bee|stack)\/?$/.test(item.url)) item.priority = 0.9;
        else if (/\/terms\/?$/.test(item.url)) item.priority = 0.3;
        else item.priority = 0.7;
        return item;
      },
    }),
  ],
  vite: {
    // `astro build` prebundles the production JSX runtime, where jsxDEV is
    // undefined. Exclude it so `astro dev` cannot pick up that stub.
    optimizeDeps: {
      exclude: ['react/jsx-dev-runtime'],
    },
  },
});
