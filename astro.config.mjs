import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://mbarrett0.github.io',
  base: '/web',
  integrations: [react()],
});
