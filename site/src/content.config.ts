import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// LESSON.md files live one level up, in the course repo itself (`web/phases`).
// This collection is the *only* consumer of the markdown -> HTML pipeline
// (remark/rehype + Shiki); exercise/solution .ts source is read separately
// in src/lib/phases.ts since it's plain code, not markdown.
const phases = defineCollection({
  loader: glob({ pattern: "*/LESSON.md", base: "../phases" }),
});

const capstone = defineCollection({
  loader: glob({ pattern: "README.md", base: "../capstone" }),
});

export const collections = { phases, capstone };
