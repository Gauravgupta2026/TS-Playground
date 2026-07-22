import { useState } from "react";

interface Props {
  solutionHtml: string;
}

/** Keeps the "struggle first" pedagogy: solutions stay collapsed until asked for. */
export default function SolutionReveal({ solutionHtml }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn--secondary btn--sm">
        Stuck? Reveal solution
      </button>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(false)} className="btn btn--secondary btn--sm" style={{ marginBottom: 10 }}>
        Hide solution
      </button>
      <div className="code-panel">
        <div className="code-panel__header">
          <span className="code-panel__tag">Solution</span>
        </div>
        <div dangerouslySetInnerHTML={{ __html: solutionHtml }} />
      </div>
    </div>
  );
}
