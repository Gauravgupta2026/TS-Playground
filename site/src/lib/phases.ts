import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

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

export type ExerciseKind = "exercise" | "checkpoint" | "drill" | "test";

export interface Exercise {
  file: string; // e.g. "01-values-and-variables.ts"
  slug: string; // e.g. "01-values-and-variables"
  label: string; // e.g. "01 · Values and variables"
  kind: ExerciseKind;
  code: string;
  solutionCode: string | null;
  runCommand: string; // exact `npm run ts ...` command from the repo root
}

export interface PhaseMeta {
  slug: string; // folder name, e.g. "01-js-foundations"
  number: number; // 1
  title: string; // "JavaScript Foundations"
  track: "core" | "advanced" | "frontier";
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
  12: "frontier", 13: "frontier",
};

function classify(file: string): ExerciseKind {
  if (file.startsWith("checkpoint-")) return "checkpoint";
  if (file.startsWith("drill-")) return "drill";
  if (file.endsWith(".test.ts")) return "test";
  return "exercise";
}

function labelFor(file: string, kind: ExerciseKind): string {
  const base = file.replace(/\.test\.ts$|\.ts$/, "");
  if (kind === "exercise") {
    const match = base.match(/^(\d+)-(.+)$/);
    if (match) {
      const [, num, slug] = match;
      return `${num} · ${titleCase(slug)}`;
    }
  }
  if (kind === "checkpoint") return `Checkpoint · ${titleCase(base.replace(/^checkpoint-/, ""))}`;
  if (kind === "drill") return `Drill · ${titleCase(base.replace(/^drill-/, ""))}`;
  return titleCase(base);
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function readPhaseTitle(slug: string): { number: number; title: string } {
  const lessonPath = path.join(PHASES_DIR, slug, "LESSON.md");
  const text = readFileSync(lessonPath, "utf-8");
  const firstLine = text.split("\n", 1)[0];
  // "# Phase 7 — RAG from Scratch"
  const match = firstLine.match(/^#\s*Phase\s+(\d+)\s*[—-]\s*(.+)$/);
  if (!match) {
    throw new Error(`LESSON.md for "${slug}" doesn't start with "# Phase N — Title": ${firstLine}`);
  }
  return { number: Number(match[1]), title: match[2].trim() };
}

function loadExercises(slug: string): Exercise[] {
  const dir = path.join(PHASES_DIR, slug);
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .sort((a, b) => a.localeCompare(b));

  return files.map((file) => {
    const kind = classify(file);
    const code = readFileSync(path.join(dir, file), "utf-8");
    const solutionPath = path.join(SOLUTIONS_DIR, slug, file);
    const solutionCode = existsSync(solutionPath) ? readFileSync(solutionPath, "utf-8") : null;
    return {
      file,
      slug: file.replace(/\.ts$/, ""),
      label: labelFor(file, kind),
      kind,
      code,
      solutionCode,
      runCommand: `npm run ts phases/${slug}/${file}`,
    };
  });
}

let cache: Phase[] | null = null;

/** All 13 phases, in order, with their exercises and solutions attached. */
export function getPhases(): Phase[] {
  if (cache) return cache;
  const slugs = readdirSync(PHASES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  cache = slugs.map((slug) => {
    const { number, title } = readPhaseTitle(slug);
    return {
      slug,
      number,
      title,
      track: TRACK_BY_NUMBER[number] ?? "core",
      exercises: loadExercises(slug),
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
