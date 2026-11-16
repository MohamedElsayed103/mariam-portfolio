import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://mariam-portfolio-hazel.vercel.app',
  devToolbar: { enabled: false },
});
