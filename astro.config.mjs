import { defineConfig } from 'astro/config';
import UnoCSS from "unocss/astro";
import ComlinkPlugin from "vite-plugin-comlink";
import svelte from "@astrojs/svelte";
import partytown from "@astrojs/partytown";

import simpleStackStream from "simple-stack-stream";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), UnoCSS(), partytown(), simpleStackStream()],
  vite: {
    plugins: [ComlinkPlugin()]
  }
});