import { readdirSync } from "node:fs";
import path from "node:path";
import { loadExercises, readLeadingHeading, type Exercise } from "./lesson";

export type { Exercise, ExerciseKind } from "./lesson";

// Everything here reads straight from the course repo (`web/phases` and
// `web/solutions`) at build time. There is no duplicated content — editing
// a LESSON.md or exercise file and rebuilding the site is the whole
// content workflow.
//
// Resolved from process.cwd() (always `site/`, since that's where `npm run
// dev`/`build` run from) rather than `import.meta.url` — the latter breaks
// once Astro's build bundles/relocates this module under dist/, changing
// its on-disk location relative to the source tree.
const COURSE_ROOT = path.resolve(process.cwd(), "..");
const PHASES_DIR = path.join(COURSE_ROOT, "phases");
const SOLUTIONS_DIR = path.join(COURSE_ROOT, "solutions");

export interface PhaseMeta {
  slug: string; // folder name, e.g. "01-js-foundations"
  number: number; // 1
  title: string; // "JavaScript Foundations"
  // Phase 12/13 used to live here as the "frontier" track; they now live
  // under capstone/ as Projects (see src/lib/projects.ts), so only two
  // tracks remain among numbered phases.
  track: "core" | "advanced";
}

export interface Phase extends PhaseMeta {
  exercises: Exercise[];
}

// Folder-name convention (`NN-slug`) doesn't encode which "track" a phase
// belongs to, but README.md's course map does — mirrored here so the site
// can group Home's phase list the same way the README does.
const TRACK_BY_NUMBER: Record<number, PhaseMeta["track"]> = {
  1: "core", 2: "core", 3: "core", 4: "core", 5: "core",
  6: "core", 7: "core", 8: "core", 9: "core",
  10: "advanced", 11: "advanced",
};

let cache: Phase[] | null = null;

/** All 11 numbered phases, in order, with their exercises and solutions attached. */
export function getPhases(): Phase[] {
  if (cache) return cache;
  const slugs = readdirSync(PHASES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  cache = slugs.map((slug) => {
    const { number, title } = readLeadingHeading(path.join(PHASES_DIR, slug, "LESSON.md"));
    if (number === null) throw new Error(`phases/${slug}/LESSON.md is missing its "# Phase N — Title" heading`);
    return {
      slug,
      number,
      title,
      track: TRACK_BY_NUMBER[number] ?? "core",
      exercises: loadExercises(path.join(PHASES_DIR, slug), path.join(SOLUTIONS_DIR, slug), `phases/${slug}`),
    };
  });
  return cache;
}

export function getPhase(slug: string): Phase | undefined {
  return getPhases().find((p) => p.slug === slug);
}

export function getPhaseMeta(): PhaseMeta[] {
  return getPhases().map(({ exercises: _exercises, ...meta }) => meta);
}
