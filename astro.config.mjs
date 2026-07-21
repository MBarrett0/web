import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mbarrett0.github.io',
  base: '/web',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
