// Progress lives entirely in the visitor's browser. No account, no server,
// no sync across devices — clearing site data resets it, same promise the
// design mockup's own footer copy makes.
const STORAGE_KEY = "ts-playground:progress";
const CHANGE_EVENT = "ts-playground:progress-change";

export interface ProgressState {
  // key: "<phase-slug>/<exercise-slug>" -> ISO completion timestamp
  completed: Record<string, string>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function progressKey(phaseSlug: string, exerciseSlug: string): string {
  return `${phaseSlug}/${exerciseSlug}`;
}

export function readProgress(): ProgressState {
  if (!isBrowser()) return { completed: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.completed) return parsed as ProgressState;
    return { completed: {} };
  } catch {
    return { completed: {} };
  }
}

function writeProgress(state: ProgressState): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function isComplete(phaseSlug: string, exerciseSlug: string): boolean {
  return Boolean(readProgress().completed[progressKey(phaseSlug, exerciseSlug)]);
}

export function setComplete(phaseSlug: string, exerciseSlug: string, complete: boolean): void {
  const state = readProgress();
  const key = progressKey(phaseSlug, exerciseSlug);
  if (complete) {
    state.completed[key] = new Date().toISOString();
  } else {
    delete state.completed[key];
  }
  writeProgress(state);
}

/** Subscribes to progress changes made anywhere on the page (same tab). */
export function onProgressChange(handler: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
