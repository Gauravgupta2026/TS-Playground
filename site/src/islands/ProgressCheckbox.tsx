import { useEffect, useState } from "react";
import { isComplete, onProgressChange, setComplete } from "../lib/progress";

interface Props {
  phaseSlug: string;
  exerciseSlug: string;
}

export default function ProgressCheckbox({ phaseSlug, exerciseSlug }: Props) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const sync = () => setDone(isComplete(phaseSlug, exerciseSlug));
    sync();
    return onProgressChange(sync);
  }, [phaseSlug, exerciseSlug]);

  return (
    <button
      type="button"
      onClick={() => setComplete(phaseSlug, exerciseSlug, !done)}
      aria-pressed={done}
      title={done ? "Mark incomplete" : "Mark complete"}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: done ? "var(--accent)" : "var(--surface)",
        border: `1px solid ${done ? "var(--accent)" : "var(--border-strong)"}`,
        color: done ? "var(--accent-contrast)" : "var(--muted)",
        display: "grid",
        placeItems: "center",
        fontSize: 14,
        cursor: "pointer",
        flex: "0 0 auto",
      }}
    >
      {done ? "✓" : "+"}
    </button>
  );
}
