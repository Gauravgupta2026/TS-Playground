import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

// Shared by src/lib/phases.ts (reads `phases/`) and src/lib/projects.ts
// (reads `capstone/12-*` and `capstone/13-*`) — both directory shapes are
// identical: a LESSON.md plus numbered/checkpoint/drill/test .ts exercises,
// with a matching (optional) folder under `solutions/`.

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

function classify(file: string): ExerciseKind {
  if (file.startsWith("checkpoint-")) return "checkpoint";
  if (file.startsWith("drill-")) return "drill";
  if (file.endsWith(".test.ts")) return "test";
  return "exercise";
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
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

/** Reads a LESSON.md's leading "# Phase N — Title" (or "# Title") heading. */
export function readLeadingHeading(lessonMdPath: string): { number: number | null; title: string } {
  const text = readFileSync(lessonMdPath, "utf-8");
  const firstLine = text.split("\n", 1)[0];
  const withNumber = firstLine.match(/^#\s*Phase\s+(\d+)\s*[—-]\s*(.+)$/);
  if (withNumber) return { number: Number(withNumber[1]), title: withNumber[2].trim() };
  const plain = firstLine.match(/^#\s*(.+)$/);
  if (!plain) throw new Error(`LESSON.md at "${lessonMdPath}" doesn't start with a "# " heading: ${firstLine}`);
  return { number: null, title: plain[1].trim() };
}

/**
 * Loads every `.ts` exercise/checkpoint/drill/test file in `lessonDir`,
 * pairing each with its counterpart in `solutionsDir` (if one exists).
 * `runPrefix` is the repo-root-relative folder (e.g. "phases/01-js-foundations"
 * or "capstone/12-context-engineering") used to build the displayed
 * `npm run ts ...` command.
 */
export function loadExercises(lessonDir: string, solutionsDir: string, runPrefix: string): Exercise[] {
  const files = readdirSync(lessonDir)
    .filter((f) => f.endsWith(".ts"))
    .sort((a, b) => a.localeCompare(b));

  return files.map((file) => {
    const kind = classify(file);
    const code = readFileSync(path.join(lessonDir, file), "utf-8");
    const solutionPath = path.join(solutionsDir, file);
    const solutionCode = existsSync(solutionPath) ? readFileSync(solutionPath, "utf-8") : null;
    return {
      file,
      slug: file.replace(/\.ts$/, ""),
      label: labelFor(file, kind),
      kind,
      code,
      solutionCode,
      runCommand: `npm run ts ${runPrefix}/${file}`,
    };
  });
}
