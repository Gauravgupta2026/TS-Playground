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

// Phase 12/13's LESSON.md files now live under capstone/ (see
// src/lib/projects.ts) but render through the same markdown pipeline as
// phase lessons — kept as a separate collection so it doesn't collide with
// the `capstone` collection above, which globs capstone/README.md only.
const projectLessons = defineCollection({
  loader: glob({ pattern: "1[23]-*/LESSON.md", base: "../capstone" }),
});

export const collections = { phases, capstone, projectLessons };
