// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://obstack.it',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'Obstack Bee guide',
      description: 'Run Obstack Bee with Docker or Kubernetes and send its OTLP traces to Vector or the OpenTelemetry Collector.',
      favicon: '/favicon.svg',
      disable404Route: true,
      customCss: ['./src/styles/starlight.css'],
      sidebar: [
        { label: 'Bee deployment', items: [
          { slug: 'guide/bee' },
          { slug: 'guide/bee/requirements' },
          { slug: 'guide/bee/docker' },
          { slug: 'guide/bee/kubernetes' },
        ] },
        { label: 'Collectors', items: [
          { slug: 'guide/bee/opentelemetry-collector' },
          { slug: 'guide/bee/vector' },
        ] },
        { label: 'Operate', items: [
          { slug: 'guide/bee/configuration' },
          { slug: 'guide/bee/verify' },
        ] },
        { label: 'Obstack website', link: '/' },
      ],
    }),
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
