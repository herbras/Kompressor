import { defineConfig } from 'astro/config';
import UnoCSS from "unocss/astro";
import ComlinkPlugin from "vite-plugin-comlink";
import svelte from "@astrojs/svelte";

import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), UnoCSS(), partytown()],
  vite: {
    plugins: [ComlinkPlugin()]
  }
});