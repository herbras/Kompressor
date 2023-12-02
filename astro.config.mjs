import { defineConfig } from 'astro/config';
import UnoCSS from "unocss/astro";
import ComlinkPlugin from "vite-plugin-comlink";
import svelte from "@astrojs/svelte";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), UnoCSS()],
  vite: {
    plugins: [ComlinkPlugin()],
    optimizeDeps: {
      exclude: ["svelte-virtual-list"]
    }
  },
});