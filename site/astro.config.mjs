import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import react from "@astrojs/react";
import sentry from "@sentry/astro";

// astro.config.mjs runs before Vite's normal env-loading, so .env needs to
// be read explicitly here to see PUBLIC_SENTRY_DSN.
const { PUBLIC_SENTRY_DSN } = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

export default defineConfig({
  integrations: [
    react(),
    // Sentry DSNs aren't secret (they're meant to ship client-side), but the
    // integration is only added when one is configured so `npm run build`
    // keeps working for anyone who hasn't set up a Sentry project yet.
    // The actual dsn/init options live in sentry.client.config.ts — passing
    // `dsn` here directly is deprecated by @sentry/astro.
    ...(PUBLIC_SENTRY_DSN
      ? [sentry({ sourceMapsUploadOptions: { enabled: false } })]
      : []),
  ],
  markdown: {
    // Code panels in this design stay dark in both light and dark site
    // themes (see --code-bg in DESIGN.md), so a single Shiki theme is correct.
    shikiConfig: { theme: "github-dark-dimmed" },
  },
});
