# Retrospective — v1.49.776

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#69+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#68+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#61 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Operator-driven scope verification before execution.** The prior session's handoff projected a "~41 file" contamination surface; first action this session was an explicit re-grep that returned 238 files. Surfaced the scope shift to the operator before any bulk operation. Avoided over-promising on the basis of a stale survey.
- **Dry-test before bulk.** First strip attempt on a single file (`1.150/index.html`) caught both bugs immediately (orphan-tail destruction in meta description + CSS selector destruction in inline style block). The diff was the verification gate; the per-file metrics ("collapse: 59 → 0; substrate-tokens: 1712 → 167") would have read as "success" without the diff.
- **Backup-before-bulk.** A `/tmp` snapshot of the 200 contaminated files (`tar -czf /tmp/nasa-contamination-backup.tar.gz -T <filelist>`, ~1 MB) preceded the bulk strip. Cheap insurance; would have enabled instant rollback had Pass-1 also misbehaved.
- **Production WebFetch as a cross-context damage probe.** A single WebFetch against `https://tibsfox.com/Research/NASA/1.176/index.html` confirmed the live damage from inside the new session's reasoning — independent of the v775 sub-agent's self-reported success. Crossing the context boundary (live HTTP vs local files vs sub-agent claims) was the verification step that the v775 ship missed.
- **Allow-list driven heal tool.** `tools/heal-orphan-tails.py` uses an explicit allow-list of 18 substrate-vocabulary roots, sorted longest-first. CSS vendor prefixes (`-apple-system`, `-webkit-`, `-moz-`) survived the heal pass cleanly because their roots are not in the allow list. Generic ` -anything` regex would have introduced new damage on the second pass.
- **Two-pattern heal.** Pattern A (prefix-substrate: ` -X` → ` substrate-X`) covers most damage; Pattern B (internal-substrate: `Y- -X` → `Y-substrate-X`) covers the rarer compound-internal damage shape. Pattern B applied first so the leftover ` -X` doesn't double-heal.
- **Counter-cadence framing.** Reframing the work as v1.49.776 counter-cadence (not a degree advance) kept the engine state clean — no false NASA-cadence claim, no SCAFFOLD-PENDING obs increment, no thread-promotion that the work doesn't earn.

## What Could Be Better

- **The v1.49.775 retrospective was self-authored by the sub-agent that built the strip script.** No cross-context check between transform-author and verification-gate-runner. Future bulk-transform ships should require an out-of-context verification (WebFetch, sibling-grep, or fresh-session re-grep) before claiming completeness.
- **"Substrate-token reduction 70-85%" was a red flag misread as a green one.** A large reduction on a bulk strip is almost always destruction. Verification metrics should be framed as conservation, not reduction: "X collapse-runs removed; legitimate substrate-vocabulary identifier-count unchanged" would have caught the bug. The v775 reduction percentages should be added to the lessons ledger as anti-patterns.
- **The strip script's three-pass design built in destructive optimization.** Pass 1 (targeted collapse-removal) was sufficient. Passes 2 and 3 were "while we're at it" tightening that, on inspection, optimized against substrate-vocabulary and CSS-selector syntax. The lesson: bulk transforms should do one targeted thing; secondary tidying should be a separate tool with separate verification.
- **Pre-existing live damage from prior FTP syncs.** This milestone only repairs v1.176 (the one cleaned at v775 ship time). The collapse-pattern in v1.150-v1.175 was present *before* the buggy script ran; those files were never script-damaged, but they were collapse-contaminated by the sub-agent trips that originally produced them, then synced to live. The v776 cleanup includes those (200 files in v1.150-v1.175 cleaned via fixed Pass-1 only).

## Decisions

- **Full plan executed (operator-authorized via 4-option prompt).** Alternative considered: skip the broader v1.150-v1.175 cleanup and only repair v1.176. Operator chose the broader cleanup as the safer forward path for any future Path A dispatch on the heliophysics axis.
- **Heal-tool authored rather than re-author v1.176 fresh.** Path C re-authorship was the alternative (~1.5 hr of main-context authorship for the 8 v1.176 files). Heal-tool was chosen because the damage was mechanical (regex-recoverable) and reusable as a future repair instrument.
- **`.bak*N` snapshots excluded from the strip surface.** Those files are intentional rollback artifacts from the v1.49.716 NASA canonical-layout campaign + follow-on grid-span fix; modifying them would corrupt the rollback safety. The sync script already excludes them from FTP push.
- **No new lesson IDs assigned in this README.** Lesson numbering is the in-cycle retrospective tooling's job; the README enumerates lesson *content* as candidates. Concrete IDs land via the retrospective tracker.

## Surprises

- **The handoff's contamination-surface estimate (41 files) was off by a factor of ~6.** Actual surface was 238 files. The handoff's survey appears to have counted only severe-collapse and select-moderate; my re-grep used the strip script's actual Pass-1 trigger criterion and surfaced the full surface.
- **Internal-substrate damage exists in addition to prefix damage.** I had expected only ` -X` orphan tails. The grep also surfaced `Y- -X` shapes (`spreading- -presence`, `moist- -rich-and-dense`, `substantial- -extent`) — the Pass-2 cap had stripped "substrate" from compound-internal positions too. Pattern B in the heal tool covers this class.
- **Pass-1-only strip behavior was actually a *tighter* prose than the original collapse-pattern.** Example: `"shallow-flowing surface water deposition substrate substrate-anchor"` → `"shallow-flowing surface water deposition substrate-anchor"`. The bare "substrate" before "substrate-anchor" was redundant filler; the strip incidentally tightens the prose. Not a goal of the cleanup — just an observation that Pass 1 alone produces readable output.
- **lftp's `--dry-run` mode prints planned `get -e -O` lines that look identical to real transfers.** The output triggered an in-session "did the sync just run for real?" check, which is the right kind of alertness but the wrong cause for alarm. The actual local mtimes confirmed dry-run integrity.

## Lessons Learned

See `04-lessons.md`.
