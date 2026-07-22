import type { APIRoute } from "astro";
import { getPhases } from "../lib/phases";
import { getProjects } from "../lib/projects";

export interface SearchEntry {
  title: string;
  section: string;
  url: string;
}

export const prerender = true;

export const GET: APIRoute = () => {
  const entries: SearchEntry[] = [];

  for (const phase of getPhases()) {
    const phaseUrl = `/phases/${phase.slug}/`;
    entries.push({ title: `Phase ${phase.number} · ${phase.title}`, section: "Phase", url: phaseUrl });
    for (const ex of phase.exercises) {
      entries.push({ title: ex.label, section: `Phase ${phase.number} · ${phase.title}`, url: `${phaseUrl}#${ex.slug}` });
    }
  }

  entries.push({ title: "Projects overview", section: "Projects", url: "/projects/" });
  for (const project of getProjects()) {
    const projectUrl = `/projects/${project.slug}/`;
    entries.push({ title: `Project ${project.order} · ${project.title}`, section: "Projects", url: projectUrl });
    if (project.kind === "lesson") {
      for (const ex of project.exercises) {
        entries.push({ title: ex.label, section: `Project ${project.order} · ${project.title}`, url: `${projectUrl}#${ex.slug}` });
      }
    }
  }

  entries.push({ title: "About this course", section: "About", url: "/about/" });

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
};
