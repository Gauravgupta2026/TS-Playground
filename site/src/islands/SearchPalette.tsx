import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "../pages/search-index.json.ts";

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  useEffect(() => {
    if (open && !index) {
      fetch("/search-index.json")
        .then((r) => r.json())
        .then(setIndex)
        .catch(() => setIndex([]));
    }
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, index]);

  const results = useMemo(() => {
    if (!index || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return index.filter((e) => e.title.toLowerCase().includes(q) || e.section.toLowerCase().includes(q)).slice(0, 20);
  }, [index, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "8px 13px",
          borderRadius: 9,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          minWidth: 190,
          color: "var(--faint)",
          font: "inherit",
          cursor: "pointer",
        }}
        aria-label="Search"
      >
        <span>⌕</span>
        <span style={{ fontSize: 13.5, flex: 1, textAlign: "left" }}>Search lessons…</span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11,
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "1px 6px",
          }}
        >
          ⌘K
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,18,12,0.45)",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            paddingTop: "12vh",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 92vw)",
              maxHeight: "60vh",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              boxShadow: "var(--shadow)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phases and exercises…"
              style={{
                padding: "16px 18px",
                border: "none",
                borderBottom: "1px solid var(--border)",
                background: "transparent",
                color: "var(--ink)",
                font: "inherit",
                fontSize: 15,
                outline: "none",
              }}
            />
            <div style={{ overflowY: "auto" }}>
              {query.trim() && results.length === 0 && (
                <div style={{ padding: 18, color: "var(--muted)", fontSize: 14 }}>No matches.</div>
              )}
              {results.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--ink)",
                  }}
                >
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>{r.title}</span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    {r.section}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
