// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://alexpacio.github.io/obstack-website',
  base: '/obstack-website',
  integrations: [react()],
});
