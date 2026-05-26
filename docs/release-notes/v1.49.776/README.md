# v1.49.776 — Template-Pollution Cleanup / Script-Bug Discovery and Repair

**Released:** 2026-05-26
**Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.775 — IMAP NASA 1.177 (INTERSTELLAR-BOUNDARY axis-opening)
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Counter-cadence parent:** v1.49.585 (first counter-cadence; concerns-cleanup)

## Summary

v1.49.776 is the **second counter-cadence milestone in the engine**, ~190 forward milestones after the first counter-cadence at v1.49.585. It repairs production damage caused by a two-bug strip script shipped at v1.49.775, and converts the discovery process into a fixed-script + heal-tool + broader cleanup of the heliophysics-axis contamination surface.

**What broke at v1.49.775.** The strip script authored mid-ship (`tools/strip-substrate-collapse.py`) carried two destructive bugs that the v775 retrospective failed to surface:

1. **Orphan-tail destruction.** The Pass-2 cap-at-5-per-paragraph rule treated `\bsubstrate\b` as a token boundary, matching inside hyphenated identifiers like `substrate-anchor`, `substrate-cumulative`, `substrate-form-distinct`. When the cap stripped excess "substrate" prefixes, it removed only the bare token and left orphan tails: `substrate-anchor` → ` -anchor`, `substrate-cumulative` → ` -cumulative`, and so on.
2. **CSS class-selector destruction.** The Pass-3 whitespace-tightening rule `r" +([\.,;:])"` stripped spaces before `.` `,` `:` `;`. CSS class selectors begin with `.`, so `body > .nav-card` → `body >.nav-card` and the descendant-combinator `h1 .subtitle` → the compound selector `h1.subtitle`.

The v775 retrospective claimed success based on the cleanup-completeness criterion that "0 collapse patterns remain." That was true, but **insufficient as a verification gate**: legitimate substrate-vocabulary had been destroyed in parallel. The reported "70-85% substrate-token reduction" was load-bearing evidence that something was wrong, but it was framed as a metric of success.

**Production verification.** A WebFetch of `https://tibsfox.com/Research/NASA/1.176/index.html` early in this milestone confirmed live damage: orphan tails like "MAGNETOSPHERE-RADIATION-BELTS -axis", "The -cumulative SwRI-PI thread", "the -form-distinct MIDEX program" had been pushed to production.

**Fix + heal + clean.** Three deliverables:

1. **`tools/strip-substrate-collapse.py` fixed.** Pass 2 + Pass 3 removed; only Pass 1 (adjacent-run collapse) retained. Pass 1 alone is targeted at the actual collapse-pattern (`\bsubstrate(?:\s+substrate)+\b`) and preserves hyphenated substrate-vocabulary intact because the trailing `\b` matches at the hyphen boundary. The docstring records both bugs and the reason for removal so the destructive passes are not reintroduced.
2. **`tools/heal-orphan-tails.py` authored.** Reverses the orphan-tail damage by prepending "substrate" back to space-prefixed hyphenated compounds whose first segment is a known substrate-vocabulary root. Two heal patterns: prefix-substrate (` -X` → ` substrate-X`) and internal-substrate (`Y- -X` → `Y-substrate-X`). Explicit root allow-list (18 substrate-vocab roots, longest-first) prevents false-positive heals on CSS vendor prefixes (`-apple-system`, `-webkit-`, etc.).
3. **Bulk strip + heal + FTP-sync.** Heal applied to the 4 contaminated v1.176 files (61 orphan tails repaired across `index.html`, `research.html`, `organism.md`, `to-1.177.md`). Fixed Pass-1 strip applied to the 200-file contamination surface across NASA 1.150-1.175 (collapse-pattern present in 92 HTML + 47 MD + 25 JSON + 12 Python + 7 TeX + 7 GLSL .frag + 7 .dsp + 4 .cir, plus prior backups excluded). Total per-file substrate-token reductions are small (1-17 tokens per file, exactly matching the actual collapse-pattern filler count — not the destructive 70-85% reduction of the buggy script). Verified post-strip: 0 CSS damage, 0 orphan-tail damage, line counts preserved across all 200 files. Healed + cleaned files FTP-synced to tibsfox.com.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA degree 1.177 (v1.49.775 close), INTERSTELLAR-BOUNDARY axis at obs#1 first INSTANCE, MUS / ELC / SPS / TRS SCAFFOLD-PENDING.
- **No new substrate-anchors emitted** — this milestone is operational-debt, not engine-cadence.
- **No new V-flags emitted** — the citation-debt ledger from v1.49.585 carries forward unchanged.
- **Counter-cadence cadence sustained** — Lesson #10168 (counter-cadence cleanup-mission cadence ~every 30 forward milestones) extends from v585 to v776, ~190 forward-cadence milestones between, with the productive trigger this time being a script-bug discovery cascade rather than accumulated social-rule debt.
- **Verification-gate discipline extends.** Lesson #10170 (system gates itself at ship time) extends with a corollary: cleanup-completeness verification must check post-state for orthogonal damage signatures, not only verify the primary pattern is gone. Adopted as forward-preventive in T14 sequence amendments below.
- **Live-site repair.** 4 v1.176 files healed (61 orphan tails) + 200 v1.150-v1.175 files cleaned + FTP-synced to https://tibsfox.com/Research/NASA/. Public-facing damage from v775 ship-time cleanup repaired.

## Threads closed / opened / extended

- **OPENED:** orthogonal-verification discipline for bulk-transform tools. A strip / heal / regex-based tool's verification step must use a *different* regex than the transform itself, against the post-state, to catch destruction the transform's own criterion would miss.
- **OPENED:** `tools/heal-orphan-tails.py` as a reusable repair instrument for the orphan-tail damage class. Allow-list-driven; safe for future re-application.
- **EXTENDED:** counter-cadence cleanup-mission cadence (Lesson #10168) — second instance, two cleanup-milestones in the engine (v585 + v776), trigger characterizes as either accumulated-social-rule-debt OR script-bug-cascade.
- **CLOSED:** destructive Pass-2 + Pass-3 in `tools/strip-substrate-collapse.py`. Docstring records the bug + rationale so the destructive passes are not reintroduced.
- **CARRY-FORWARD:** all v1.49.775 thread states (NASA 1.177; INTERSTELLAR-BOUNDARY axis; engine state).

## Forward lessons emitted

7 new lesson candidates (numbering continues from the v1.49.775 ledger; the in-cycle retrospective tooling assigns concrete IDs):

- **Two-bug strip cascade was undetectable from inside its own verification.** The v775 retrospective authored the cleanup, the success metric, and the chapter pipeline in the same sub-agent context. A verification gate that runs in the same context as the transform shares the transform's blind spots.
- **Cleanup-completeness check must include orthogonal damage signatures.** "Primary pattern gone" is insufficient. A bulk-strip's verification must also grep for post-state damage shapes (orphan tails, broken combinators, line-count drift, etc.) before claiming success.
- **High-rate-of-reduction metrics are red flags, not green ones.** A 70-85% substrate-token reduction on the v775 ship was framed as success; on inspection it was the destruction count. Bulk transforms that report large reductions warrant explicit "what did we lose" auditing.
- **Production WebFetch is a cheap and load-bearing post-ship verification.** A single WebFetch against the live page surfaced the orphan-tail damage instantly; the same check would have caught the v775 bug at ship time had it been a T14 step.
- **Heal-tool allow-list discipline.** Reverse-direction transforms (e.g., heal-orphan-tails) need an explicit allow-list of legitimate target tokens, not a generic regex over the damage shape. CSS vendor prefixes look like orphan tails to a generic pattern.
- **Backup-before-bulk-operation discipline.** A `/tmp` snapshot of the contamination surface (`tar -czf /tmp/nasa-contamination-backup.tar.gz -T <filelist>`) is ~1 MB of safety per ~200-file campaign. The v776 cleanup had this safety net; v775 did not.
- **Internal-substrate damage pattern (`Y- -X`).** The Pass-2 cap also damaged compound identifiers like `spreading-substrate-presence` to `spreading- -presence`. Rarer than prefix damage but real (3 unique instances across v1.176). Pattern B in the heal tool covers this class.

## Tooling added

| File | Status | Purpose |
|------|--------|---------|
| `tools/strip-substrate-collapse.py` | modified (Pass 2 + 3 removed) | Collapse adjacent "substrate" runs only; preserves substrate-vocabulary and CSS. |
| `tools/heal-orphan-tails.py` | new | Repair orphan-tail damage by prepending "substrate" to recognised hyphenated compounds. |

## Files repaired / cleaned

- **Healed (4 files, 61 orphan tails):** `www/tibsfox/com/Research/NASA/1.176/{index.html, research.html, organism.md, to-1.177.md}`.
- **Cleaned (200 files, ~250 collapse-runs):** all active mission-page files across NASA 1.150-1.175 with substrate-substrate adjacent-run contamination. `.bak*N` snapshots intentionally excluded (rollback artifacts; not synced to live).
- **FTP-synced:** Research/NASA tree to tibsfox.com via `scripts/sync-research-to-live.sh --nasa-only`.

## T14 ship-sequence amendments

Carrying forward into v1.49.777+:

- **Post-ship live-page verification step** (new) — WebFetch the freshest mission page; grep the returned markdown for orphan-tail patterns (` -anchor`, ` -cumulative`, ` -axis`, ` -form-distinct`) and broken-combinator patterns (`>.nav-card`, `h1.subtitle`). Zero hits required to close the ship.
- **Pre-dispatch contamination audit** (reinforces v1.49.775 amendment 1) — `grep -c "substrate substrate" <predecessor-mission-source-files>` before any future Path A dispatch. If any required-reading file has count > 0, run `python3 tools/strip-substrate-collapse.py <files>` BEFORE dispatch.
- **Backup-before-bulk-transform** (new) — `tar -czf /tmp/<milestone>-contamination-backup.tar.gz -T <filelist>` snapshot before any multi-file scripted edit. ~1 MB / 200-file campaign; cheap insurance.

## Thread state

CHAIN-CONVENTIONS sustains. NASA degree sustains at 1.177. Counter-cadence as a cadence (Lesson #10168) extends to its second instance.

---
**Prev:** [v1.49.775](../v1.49.775/README.md) · **Next:** v1.49.777+
