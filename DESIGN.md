# TS Playground — Design System

Source of truth for visual design when building the web app. This file is a
condensed reference; the linked `.dc.html` files are the **canonical**
markup/values — when implementing a component, open the relevant file and
copy the exact styles rather than re-deriving them from this summary.

**Canonical source files** (do not delete/move without updating this link):

- [`TS Playground Design System.dc.html`](../TS%20Playground%20design%20system/TS%20Playground%20Design%20System.dc.html) — full component library (colors, type, buttons, badges, cards, forms, callouts, code blocks, nav, docs shell, projects layout)
- [`TS Playground.dc.html`](../TS%20Playground%20design%20system/TS%20Playground.dc.html) — applied product mockup: Home (streak graph + phase list), Docs (lesson page), Projects (overview) views

Both are self-contained `.dc.html` files — open directly in a browser to see the live, interactive reference (theme toggle included).

## Aesthetic

Warm, editorial, encouraging. Serif headings, plain-spoken sans body text,
monospace for anything machine-adjacent (labels, code, data, status). A single
emerald accent on warm paper neutrals. Not a typical dark "hacker" dev-tool
palette — closer to a well-typeset book that happens to run code.

## Fonts


| Role               | Family               | Notes                                       |
| ------------------ | -------------------- | ------------------------------------------- |
| Headings           | `Newsreader` (serif) | weight 500 default, italic for blockquotes  |
| Body / UI          | `Public Sans` (sans) | weight 400 body, 600 for buttons/labels     |
| Code, labels, data | `IBM Plex Mono`      | uppercase + letter-spacing for small labels |


Loaded via Google Fonts:

```
family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500
&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400
&family=IBM+Plex+Mono:wght@400;500;600
```

### Type scale


| Token   | Family        | Weight | Size            | Tracking         |
| ------- | ------------- | ------ | --------------- | ---------------- |
| Display | Newsreader    | 500    | 56–84px (clamp) | -.02em           |
| Heading | Newsreader    | 500    | 34px            | -.01em           |
| Subhead | Newsreader    | 500    | 22–28px         | 0                |
| Body    | Public Sans   | 400    | 16–17px         | 0                |
| Label   | IBM Plex Mono | 600    | 12–13px         | .14em, uppercase |
| Code    | IBM Plex Mono | 400    | 13–15px         | 0                |


## Color tokens

All colors are CSS custom properties on `:root`, overridden under
`[data-theme="dark"]`. Theme is applied via a `data-theme` attribute (light/dark), not a class.


| Token               | Light     | Dark      |
| ------------------- | --------- | --------- |
| `--paper`           | `#f6f4ec` | `#181712` |
| `--surface`         | `#fffdf6` | `#211f18` |
| `--surface-2`       | `#efece1` | `#2a2820` |
| `--code-bg`         | `#1f2a24` | `#12140f` |
| `--ink`             | `#232019` | `#f3f0e6` |
| `--ink-soft`        | `#4a463c` | `#d7d3c6` |
| `--muted`           | `#77726a` | `#a6a196` |
| `--faint`           | `#9c978d` | `#787369` |
| `--border`          | `#e4e0d3` | `#332f26` |
| `--border-strong`   | `#d3cec0` | `#423d31` |
| `--accent`          | `#0f9b6a` | `#2fd08a` |
| `--accent-ink`      | `#0a6f4c` | `#5ee3a6` |
| `--accent-tint`     | `#e4f2ea` | `#152820` |
| `--accent-contrast` | `#ffffff` | `#0c130f` |
| `--warn`            | `#b8791b` | `#e0a94b` |
| `--warn-tint`       | `#f6edda` | `#2a2313` |


Background is `--paper` with a subtle radial dot pattern (`22px 22px` grid,
`--dot` token) — not a flat fill.

## Layout

- Content max-width: `1120px` (design system page) / `1280px` (product shell)
- Page padding: `28px` (design system) / `26px` (product) horizontal
- Section vertical rhythm: `70px` top padding between major sections, `1px` `--border` hairline dividers
- Docs/Projects shells: 3-column grid — sidebar (`230–260px`) / content (`1fr`) / on-this-page rail (`200–220px`)
- Card radius: `14px`; pill/badge radius: `99px`; small controls: `8–10px`
- Shadow: `0 1px 2px rgba(40,36,25,.05), 0 10px 26px -14px rgba(40,36,25,.16)` (dark theme uses black-based equivalent, see `--shadow` token)

## Components (see Design System file, section numbers match `sc-for` blocks)

1. **Brand/logo** — 30–56px rounded-square tile, `TS` mono monogram, black ivory fill; wordmark pairs Newsreader "TypeScript" + mono uppercase "Playground"
2. **Color/tokens** — swatch grid (accent / neutrals / support)
3. **Typography** — type scale table
4. **Buttons** — Primary (filled accent), Secondary (outlined), Ghost, Ink/dark CTA, Disabled; plus compact mono "verb" buttons (`BUILD` / `READ` / `REVIEW`) at 8px/14px padding, 11.5px uppercase mono
5. **Badges/chips/status** — status dot legend (Complete/In Progress/Planned), pill badges (New/Beginner/Advanced/Draft), language tag chips
6. **Cards &amp; lesson rows** — kicker+number card with title/body/footer; lesson list rows with status mark, action button, language tag, checkbox
7. **Progress &amp; stats** — labeled progress bars (animated `scaleX` fill), stat tiles (big Newsreader number + mono label)
8. **Forms** — text field, search-with-shortcut-chip, select, custom checkbox, custom switch — all `10px` radius, `--paper` fill, focus ring = `0 0 0 3px var(--accent-tint)`
9. **Callouts/blockquotes** — Tip (accent tint), Note (warn tint), italic Newsreader pull-quote with left accent border
10. **Code/terminal** — dark `--code-bg` panel, mono syntax-highlighted TS snippet; separate bash/terminal panel with traffic-light dots and `$` prompt
11. **Navigation** — sticky top bar: logo lockup, search-with-⌘K, centered nav links, solid dark CTA button, theme toggle + avatar
12. **Docs shell** — 3-col: phase sidebar / lesson content (kicker, H1, accent underline, blockquote, objectives box, prose, code block, tip, prev/next footer) / on-this-page rail
13. **Projects shell** — 3-col: project list sidebar / welcome + numbered project overview / on-this-page rail

## Product views (see Product Mockup file)

- **Home** — hero (H1 + subhead + two CTAs), GitHub-style contribution/streak graph (52-week grid, 5-level accent intensity), phase list (roman numeral, status mark, name, count, index) with status legend
- **Docs** — lesson reading view per component #12 above; right rail includes a lesson-progress bar in addition to TOC
- **Projects** — overview view per component #13 above, plus a "How to Proceed" 2-up card row

State/theme switching in both files is handled client-side (`dark` boolean, `view` string) — not relevant to the static design, but shows the intended interaction model (single-page view swap, not full navigation, for the product shell).

## Implementation notes

- Treat every color as a token, never a hardcoded hex, so dark mode is a single attribute flip.
- Uppercase mono labels get `letter-spacing: .08em–.16em` — don't skip the tracking, it's load-bearing for the "editorial system" feel at small sizes.
- Radius and shadow values above are copy-exact from the source files; keep them as shared constants rather than re-guessing per component.

