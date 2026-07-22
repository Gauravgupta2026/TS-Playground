import { useEffect, useMemo, useState } from "react";
import { onProgressChange, readProgress } from "../lib/progress";

const DAY_MS = 24 * 60 * 60 * 1000;
const LEVEL_COLORS = [
  "var(--surface-2)",
  "color-mix(in srgb, var(--accent) 32%, var(--surface-2))",
  "color-mix(in srgb, var(--accent) 56%, var(--surface-2))",
  "color-mix(in srgb, var(--accent) 80%, var(--surface-2))",
  "var(--accent)",
];

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildWeeks(countsByDay: Map<string, number>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = 52 * 7;
  const start = new Date(today.getTime() - (totalDays - 1) * DAY_MS);
  // Align to the most recent Sunday on/before `start` so columns are real weeks.
  start.setDate(start.getDate() - start.getDay());

  const weeks: { days: { bg: string; date: string; count: number }[] }[] = [];
  let cursor = new Date(start);
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const key = dateKey(cursor);
      const count = countsByDay.get(key) ?? 0;
      const future = cursor.getTime() > today.getTime();
      let level = 0;
      if (!future) {
        if (count >= 5) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;
      }
      days.push({ bg: LEVEL_COLORS[level], date: key, count });
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
    weeks.push({ days });
  }
  return weeks;
}

function computeStreaks(countsByDay: Map<string, number>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  let cursor = new Date(today);
  while (countsByDay.get(dateKey(cursor))) {
    current++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  let longest = 0;
  let running = 0;
  const days = [...countsByDay.keys()].sort();
  let prev: string | null = null;
  for (const day of days) {
    if (prev) {
      const gapDays = Math.round((new Date(day).getTime() - new Date(prev).getTime()) / DAY_MS);
      running = gapDays === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }
    longest = Math.max(longest, running);
    prev = day;
  }

  return { current, longest };
}

export default function StreakGraph() {
  const [completed, setCompleted] = useState<Record<string, string>>({});

  useEffect(() => {
    const sync = () => setCompleted(readProgress().completed);
    sync();
    return onProgressChange(sync);
  }, []);

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const iso of Object.values(completed)) {
      const key = new Date(iso).toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [completed]);

  const weeks = useMemo(() => buildWeeks(countsByDay), [countsByDay]);
  const { current, longest } = useMemo(() => computeStreaks(countsByDay), [countsByDay]);
  const totalCompleted = Object.keys(completed).length;

  const stats = [
    { n: current, k: "Day streak" },
    { n: longest, k: "Longest streak" },
    { n: totalCompleted, k: "Exercises done" },
  ];

  return (
    <div className="card" style={{ padding: "26px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 18, marginBottom: 22 }}>
        <div>
          <div className="eyebrow-label" style={{ color: "var(--accent-ink)", marginBottom: 6 }}>Your learning streak</div>
          <div className="subhead" style={{ fontSize: 20 }}>
            {totalCompleted === 0 ? "Complete your first exercise to start the graph." : "Keep the fire going — you're on a roll."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 30 }}>
          {stats.map((s) => (
            <div key={s.k}>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 28, fontWeight: 500, lineHeight: 1, color: "var(--accent)" }}>{s.n}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginTop: 6 }}>
                {s.k}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 3, minWidth: "min-content" }}>
          {weeks.map((wk, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {wk.days.map((cell) => (
                <span
                  key={cell.date}
                  title={`${cell.date}: ${cell.count} exercise${cell.count === 1 ? "" : "s"}`}
                  style={{ width: 13, height: 13, borderRadius: 3, background: cell.bg, display: "block" }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--faint)" }}>52 weeks · one square per day of practice</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--muted)" }}>
          Less
          {LEVEL_COLORS.map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 3, background: c, display: "block" }} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
