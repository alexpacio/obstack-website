// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://alexpacio.github.io/obstack-website',
  base: '/obstack-website',
  vite: {
    plugins: [tailwindcss()]
  }
});