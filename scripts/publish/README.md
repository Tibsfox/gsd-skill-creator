# `scripts/publish/` — Research Publication Pipeline

Formalizes the one-off publish pattern that shipped 4 pages to tibsfox.com on
**2026-04-22** (BLN/nonlinear-frontier, CSP/soliton-resolution,
TIBS/merle-breakthrough-2026, TIBS/erdos-1196-ai-proof) into a reusable
subsystem so any future research FINAL.md can follow the same carve → build →
index → sync flow without bespoke scripting.

## Components

| File                        | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `section-map.yaml`          | Maps FINAL.md heading anchors to per-topic output slugs + titles |
| `carve-final.sh`            | Slices a research FINAL.md into per-topic markdown files         |
| `build-page.sh`             | Renders one carved markdown → MathJax-enhanced HTML + copies PDF |
| `update-research-index.sh`  | Idempotently adds new page links to `Research/index.html`        |
| `README.md`                 | This file                                                        |

The FTP deploy step is **not** part of this pipeline; it lives in
`scripts/sync-research-to-live.sh` and runs after `build-page.sh` + the index
update are complete.

## Pipeline

1. **Carve** — `carve-final.sh <section-map.yaml> --output-dir /tmp/carved`
   slices `FINAL.md` into one markdown file per output slug.
2. **Build** — `build-page.sh <carved-dir> <output-root>` produces a
   standalone MathJax-enhanced HTML page and copies the source PDF next to
   it. `output-root` is the research root (`www/tibsfox/com/Research`).
3. **Index** — `update-research-index.sh <section-map.yaml> <research-root>`
   appends new page links to `Research/index.html`. Idempotent: re-running
   with no missing slugs is a byte-identical no-op.
4. **Sync** — `scripts/sync-research-to-live.sh` (pre-existing) pushes
   `www/tibsfox/com/Research/` to tibsfox.com via FTP.

## End-to-end example (reproduces the 2026-04-22 ship)

```bash
# 1. Carve FINAL.md into per-topic markdown
scripts/publish/carve-final.sh scripts/publish/section-map.yaml --output-dir /tmp/carve-run

# 2. Build each page (loop over carved subdirectories)
for d in /tmp/carve-run/*/; do
    scripts/publish/build-page.sh "$d" www/tibsfox/com/Research
done

# 3. Update the Research index (idempotent)
scripts/publish/update-research-index.sh scripts/publish/section-map.yaml www/tibsfox/com/Research

# 4. Sync to tibsfox.com (dry-run first)
scripts/sync-research-to-live.sh --dry-run
scripts/sync-research-to-live.sh
```

## Safety gates (author-responsibility, checked pre-publish)

These gates are documented here because the pipeline ships HTML as-is; they
are **not** programmatic filters. Each gate must be verified in the source
`.md` before running the carve step. They trace back to
`.planning/missions/nonlinear-systems-clouds/milestone-package/00-milestone-spec.md`
§Safety Considerations.

- **SC-SRC** — every claim traces to a bibliography entry in
  `bibliography.md`; no orphan factoids.
- **SC-NUM** — every numerical claim (percent, magnitude, AUROC, count,
  date, duration) has an inline citation on the same or adjacent sentence.
- **SC-ADV** — no policy advocacy language. Phrases like "should regulate",
  "must mandate", "ought to restrict" do not belong in research output;
  stick to descriptive and factual reporting.
- **SC-QUOTE-LEN** — no direct quotation exceeds **15 words**. If longer
  context is needed, paraphrase with citation.
- **SC-QUOTE-COUNT** — at most **one direct quote per source**. Multiple
  quotes from the same source dilute attribution and imply derivative scope.
- **SC-TM** — trademarks and institutional names carry attribution on first
  use. No bare reference to "Anthropic", "OpenAI", "Google DeepMind",
  "Clay Institute", etc. without context.
- **SC-VER** — every date and version is absolute (`2026-04-22`,
  `v1.49.568`), never relative ("last week", "recent", "upcoming release").

A pre-publish author checklist would be: grep the carved markdown for
likely-offending patterns (`regulat*`, `mandat*`, dollar-sign quote marks
without attribution, relative dates like `last week|recent|upcoming`), then
hand-verify each match against the seven gates above.

## Logging

Every real run appends to
`.planning/missions/<mission>/milestone-package/publish-log.md` with:

- timestamp (absolute, UTC)
- git commit short SHA the pipeline ran against
- list of carved files (count + byte total)
- list of built pages (slug + HTML byte count)
- dry-run vs real
- outcome (PASS / PARTIAL / FAIL)

See
`.planning/missions/nonlinear-systems-clouds/milestone-package/publish-log.md`
for the 2026-04-23 reproduction entry and the original 2026-04-22 ship log.

## Known limitations (1.0 release)

- **Render drift** — the 2026-04-22 pages were hand-rendered with a bespoke
  HTML template (custom CSS per slug, color-palette match to the topic,
  structured `<header>` with celestial orbs). The pipeline uses
  `pandoc --standalone`, which yields plain semantic HTML. Reproduction is
  **byte-different** but **content-equivalent** — headings, paragraphs,
  math, citations, tables all survive; the visual chrome does not.
- **Single section-map per run** — no support yet for running the pipeline
  against multiple FINAL.md files in one invocation. Wrap in a shell loop
  if needed.
- **No HTML post-process hooks** — if a future mission wants the bespoke
  chrome back, add a per-slug template system in a follow-up phase.
