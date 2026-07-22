import path from "node:path";
import { loadExercises, readLeadingHeading, type Exercise } from "./lesson";

const COURSE_ROOT = path.resolve(process.cwd(), "..");
const CAPSTONE_DIR = path.join(COURSE_ROOT, "capstone");
const SOLUTIONS_DIR = path.join(COURSE_ROOT, "solutions");

export type Project =
  | {
      kind: "lesson";
      slug: string; // "context-engineering" | "applied-ai-engineering"
      order: number;
      title: string;
      description: string;
      exercises: Exercise[];
    }
  | {
      kind: "capstone";
      slug: "multi-agent-crew";
      order: number;
      title: string;
      description: string;
    };

// Phase 12 and 13 became hands-on Projects rather than numbered curriculum
// phases (see DESIGN.md's Projects Shell + PROGRESS.md's "Capstone
// Projects" section) — their content is unchanged, just relocated under
// capstone/ and presented through /projects/ instead of /phases/.
const LESSON_PROJECTS = [
  { slug: "context-engineering", sourceDir: "12-context-engineering", order: 1 },
  { slug: "applied-ai-engineering", sourceDir: "13-applied-ai-production", order: 2 },
] as const;

let cache: Project[] | null = null;

export function getProjects(): Project[] {
  if (cache) return cache;

  const lessonProjects: Project[] = LESSON_PROJECTS.map(({ slug, sourceDir, order }) => {
    const lessonDir = path.join(CAPSTONE_DIR, sourceDir);
    const { title } = readLeadingHeading(path.join(lessonDir, "LESSON.md"));
    return {
      kind: "lesson" as const,
      slug,
      order,
      title,
      description: PROJECT_DESCRIPTIONS[slug],
      exercises: loadExercises(lessonDir, path.join(SOLUTIONS_DIR, "capstone", sourceDir), `capstone/${sourceDir}`),
    };
  });

  const capstoneProject: Project = {
    kind: "capstone",
    slug: "multi-agent-crew",
    order: 3,
    title: "Multi-Agent Crew",
    description: PROJECT_DESCRIPTIONS["multi-agent-crew"],
  };

  const result = [...lessonProjects, capstoneProject].sort((a, b) => a.order - b.order);
  cache = result;
  return result;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

const PROJECT_DESCRIPTIONS: Record<string, string> = {
  "context-engineering":
    "Budgeted context assembly, compaction and tool-result clearing, agentic memory, subagent isolation, and a long-running harness with checkpoint/recovery.",
  "applied-ai-engineering":
    "Contextual retrieval and hybrid search, reranking, bias-aware LLM-as-judge evals, semantic caching, OpenTelemetry tracing, and guardrail pipelines composed into a production RAG endpoint.",
  "multi-agent-crew":
    "A RAG-powered multi-agent research CLI: a planner, a researcher, a writer, and a critic collaborating with citations. Everything from the earlier phases, used unassisted.",
};
