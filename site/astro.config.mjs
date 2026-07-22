import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  markdown: {
    // Code panels in this design stay dark in both light and dark site
    // themes (see --code-bg in DESIGN.md), so a single Shiki theme is correct.
    shikiConfig: { theme: "github-dark-dimmed" },
  },
});
