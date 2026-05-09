# SVG Accessibility Checklist

The production-ready discipline for any SVG that ships in a SCRIBE-class corpus. Derived from Doc 06.

## Required (BLOCKER if not met)

1. **Root `<svg>` has a `role` attribute.**
   - `role="img"` — for figures, illustrations, icons (SVG-as-image).
   - `role="graphics-document"` — for charts, maps, schematics (SVG-as-document, navigable).
   - `role="presentation"` + `aria-hidden="true"` — for purely decorative SVG.

2. **Root `<svg>` has `aria-labelledby="t d"`** (or `aria-label="…"` if a description is unnecessary).

3. **First child is `<title id="t">…</title>`** — one short sentence, the accessible name.

4. **Second child is `<desc id="d">…</desc>`** — one paragraph, the accessible description.

5. **No raster fallback.** No `<image>` elements pointing to PNG/JPEG. Pure vector.

## Strongly recommended

6. **Colour-and-contrast.** WCAG 2.2 §1.4.3 / §1.4.11: ≥ 4.5:1 for text under 18 pt, ≥ 3:1 for text 18 pt+ or graphical elements that convey information.

7. **Information-conveying colour pairs include a non-colour cue** (label, pattern, shape) per WCAG 2.2 §1.4.1.

8. **Animations have a `prefers-reduced-motion: reduce` fallback** that either disables motion (`animation: none`) or snaps directly between states (`animation-timing-function: step-end`).

9. **Auto-playing animation longer than 5 s offers a pause control** OR a non-animated default OR is gated on the user's motion preference.

10. **Decorative children inside an otherwise-meaningful SVG carry `aria-hidden="true"`** to avoid AT noise.

11. **`<title>` and `<desc>` text avoids strings that look like commands an AT might misread.**

## SCRIBE-class additions

12. **Structural navigation (for `graphics-document`).** Major groups carry `role="graphics-object"` with `aria-label="…"`; individual data marks carry `role="graphics-symbol"` with a per-mark `aria-label` carrying the data-derived narration ("January, 5 milestones").

13. **Validation passes `validators/a11y-check.ts`.**

14. **Validation passes `xmllint --noout --schema svg.xsd validators/svg.xsd input.svg`.**

15. **Optimisation passes `svgo --config validators/svgo.config.js`** without disturbing required attributes (the SCRIBE config preserves them by default).

## Manual review

- Open in NVDA + Firefox; confirm narration matches author's intent.
- Open in VoiceOver + Safari (macOS); confirm narration matches.
- Tab into the SVG (if interactive); confirm focus order makes sense.
- Activate `prefers-reduced-motion` in OS settings; confirm fallback engages.

## Citations

See Doc 06 (`../../../.planning/missions/v1-49-621-scribe/t2-svg-substrate/06-svg-accessibility.md`) for the full discussion. Standards: WCAG 2.2, WAI-ARIA 1.2, WAI-ARIA Graphics Module 1.0, SVG Accessibility API Mappings.
