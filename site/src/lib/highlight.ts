import { codeToHtml } from "shiki";

// Same theme as astro.config.mjs's markdown.shikiConfig, kept in sync so
// LESSON.md code fences and exercise/solution panels look identical.
const THEME = "github-dark-dimmed";

export async function highlightTs(code: string): Promise<string> {
  return codeToHtml(code, { lang: "ts", theme: THEME });
}
