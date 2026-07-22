import { useEffect, useState } from "react";
import { onProgressChange, progressKey, readProgress } from "../lib/progress";

interface PhaseRow {
  slug: string;
  number: number;
  title: string;
  exerciseSlugs: string[];
}

interface Props {
  phases: PhaseRow[];
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV"];

export default function PhaseList({ phases }: Props) {
  const [completed, setCompleted] = useState<Record<string, string>>({});

  useEffect(() => {
    const sync = () => setCompleted(readProgress().completed);
    sync();
    return onProgressChange(sync);
  }, []);

  return (
    <div>
      {phases.map((p) => {
        const done = p.exerciseSlugs.filter((s) => completed[progressKey(p.slug, s)]).length;
        const total = p.exerciseSlugs.length;
        const state = done === 0 ? "planned" : done === total ? "done" : "progress";
        return (
          <a
            key={p.slug}
            href={`/phases/${p.slug}/`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "20px 6px",
              borderTop: "1px solid var(--border)",
              color: "inherit",
            }}
          >
            <span style={{ flex: "0 0 44px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: "var(--accent-ink)" }}>
              {ROMAN[p.number - 1] ?? p.number}.
            </span>
            <span className={`status-dot status-dot--${state}`} />
            <span
              style={{
                flex: 1,
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 16,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                color: state === "planned" ? "var(--muted)" : "var(--ink)",
                fontWeight: 500,
              }}
            >
              {p.title}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: "var(--muted)" }}>
              {done} / {total}
            </span>
            <span style={{ flex: "0 0 40px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: "var(--faint)" }}>
              {String(p.number).padStart(2, "0")}
            </span>
          </a>
        );
      })}
      <div className="hairline" />
      <div
        style={{
          display: "flex",
          gap: 22,
          alignItems: "center",
          marginTop: 26,
          flexWrap: "wrap",
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 11.5,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="status-dot status-dot--done" />Complete</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="status-dot status-dot--progress" />In progress</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="status-dot status-dot--planned" />Not started</span>
      </div>
    </div>
  );
}
