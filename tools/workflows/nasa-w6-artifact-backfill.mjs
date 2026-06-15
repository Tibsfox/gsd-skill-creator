export const meta = {
  name: 'nasa-w6-artifact-backfill',
  description: 'W6: backfill the substrate-era artifact tree (story/audio/circuits/sims) + retrospective chain for collapsed NASA missions (1.169+)',
  phases: [
    { title: 'Backfill', detail: 'per mission: 4 parallel agents — story, circuits, sims, audio+retrospective' },
  ],
}

const ROOT = '/media/foxy/ai/GSD/dev-tools/gsd-skill-creator'
const NASA = `${ROOT}/www/tibsfox/com/Research/NASA`

const DONE_SCHEMA = {
  type: 'object',
  required: ['version', 'role', 'files'],
  properties: {
    version: { type: 'string' },
    role: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

const missions = Array.isArray(args) ? args : JSON.parse(String(args || '[]'))
if (!Array.isArray(missions) || missions.length === 0) throw new Error('missions args empty/invalid: ' + typeof args)
log(`W6 artifact backfill: ${missions.length} missions × 4 agents`)

// Shared context every agent gets. Substrate-era target shape = NASA 1.150 exactly
// (12 artifact files + retrospective pair). Each mission already ships
// shaders/{slug}.frag + shaders/viewer.html (leave them). DO NOT touch index.html
// or any track page — this wave only adds files under artifacts/ and retrospective/.
const shared = (v) => `NASA Mission Series degree ${v}. You are backfilling missing creative+technical artifacts so this mission matches its substrate-era neighbors. The CANONICAL STRUCTURAL EXEMPLAR you must mirror for layout/format is NASA 1.150 at ${NASA}/1.150/ (read the relevant files there for shape, register, and depth). Mission facts come from THIS mission's own ${NASA}/${v}/research.md, organism.md, index.html, and degree-sync.json — READ THEM FIRST to learn the spacecraft, instruments, paired animal + plant, dates, and science.

HARD RULES:
- Write ONLY the files assigned to your role, under ${NASA}/${v}/artifacts/ (and retrospective/ for the audio+retro role). NEVER touch index.html, track pages (research/papers/organism/mathematics/curriculum/simulation .html), the existing shaders/ files, JSON data files, or any other mission's directory.
- Never create *.bak* files. No generator scripts — hand-author factually-grounded content.
- Engineering/naturalist register. No references to AI assistants or model names. No metaphysical claims about organisms (behavioral descriptions only).
- Content must be specific to THIS mission's real hardware, science, dates, and paired species — not boilerplate. Use placeholders only where a real value is genuinely unavailable, and comment them clearly.
- Slugs: short, kebab-case, mission-specific (e.g. "${v.replace('.', '-')}-..." style consistent with 1.150's naming).

IDEMPOTENT RE-RUN (this wave resumes after interruptions): FIRST list your role's target directory (ls ${NASA}/${v}/artifacts/...). If ALL your assigned files already exist and are non-empty/substantive, briefly verify them and RETURN their paths WITHOUT rewriting (do not duplicate or clobber good work). If SOME exist, author ONLY the missing ones and leave the existing good files untouched. Only author from scratch when none exist.`

const roles = [
  {
    key: 'story',
    prompt: (v) => `${shared(v)}

YOUR ROLE: STORY. Author exactly two files (model both on ${NASA}/1.150/artifacts/story/heat-shield-rock-first-meteorite-on-another-planet.{html,tex}):
1. artifacts/story/{slug}.html — creative nonfiction, 2500-4000 words, weaving this NASA mission + its paired animal + paired plant into one narrative grounded in real events. Self-contained HTML with the same <style> idiom as the 1.150 story (dark theme, Libre Baskerville headings). Engineering-historical register; vivid but factual.
2. artifacts/story/{slug}.tex — XeLaTeX-compilable LaTeX source of the same piece (article + amsmath + hyperref + geometry + fancyhdr only), ~150 lines.
Return JSON: version, role:"story", files (paths written), notes.`,
  },
  {
    key: 'circuits',
    prompt: (v) => `${shared(v)}

YOUR ROLE: CIRCUITS. Pick ONE real mission-era instrument/sensor/subsystem of THIS mission and author exactly three files (model on ${NASA}/1.150/artifacts/circuits/mer-rover-flash-memory-bank-7-amnesia-recovery.{cir,md,html}):
1. artifacts/circuits/{slug}.cir — ngspice netlist (80-200 lines) modeling that circuit; runnable, commented, real component values where known (placeholders clearly commented otherwise).
2. artifacts/circuits/{slug}.md — design doc (200-500 lines): schematic description, parts list, operating principle, modern DIY equivalent.
3. artifacts/circuits/{slug}.html — self-contained styled HTML presentation of the circuit (same dark-theme idiom as the 1.150 circuits .html: meta block, tables, diagram block). NOT a harness loader — a standalone design-doc page (~120 lines).
Return JSON: version, role:"circuits", files, notes.`,
  },
  {
    key: 'sims',
    prompt: (v) => `${shared(v)}

YOUR ROLE: SIMULATIONS. Author exactly three files (model on ${NASA}/1.150/artifacts/sims/):
1. artifacts/sims/{analytical}.py — Python 3 + numpy + matplotlib, 200-400 lines, a mission-specific analytical simulation (trajectory, orbit, instrument response, etc.). Runnable; docstring + plots; real parameters.
2. artifacts/sims/{explorer}.py — a second Python sim (retrieval / parameter-fit / cohort-arithmetic / data explorer), 200-400 lines.
3. artifacts/sims/{interactive}.html — standalone interactive HTML+canvas/SVG visualization (300-500 lines): mission trajectory/event sequence OR paired-species visualization (foodweb, call spectrogram, range map). Self-contained, no external deps.
Return JSON: version, role:"sims", files, notes.`,
  },
  {
    key: 'audio-retro',
    prompt: (v) => `${shared(v)}

YOUR ROLE: AUDIO + RETROSPECTIVE CHAIN. Author exactly four files.
Audio (model on ${NASA}/1.150/artifacts/audio/*.dsp — Faust DSP, no runner HTML needed):
1. artifacts/audio/{mission}-synth.dsp — Faust DSP (100-250 lines) synthesizing this mission's audio signature (launch, telemetry, maneuver/instrument events). Declared params, comments.
2. artifacts/audio/{species}.dsp — Faust DSP (80-150 lines) for the paired ANIMAL's vocalization/behavior sound (or paired plant's ecological sound if the animal is non-vocal).
Retrospective chain (schema per ${ROOT}/.planning/NASA-DEGREE-CANONICAL.md §15; model on a substrate mission that HAS them, e.g. ${NASA}/1.74/retrospective/lessons-carryover.json):
3. retrospective/lessons-carryover.json — { missionVersion:"${v}", predecessor:"<the N-1 mission version>", readFromPredecessor:"<path or note>", appliedLessons:[{id,summary,applicationInThisMission}], newLessons:[{id,summary,carryForwardTo:[...],scope}], corpusDeltaHints:[...] }. At least 1 applied + 1 new lesson, grounded in THIS mission's actual engineering/science. Valid JSON.
4. retrospective/corpus-deltas.md — 300-800 words freeform prose: what this mission reveals about earlier missions, with explicit retrofit hints.
Return JSON: version, role:"audio-retro", files, notes.`,
  },
]

const results = await pipeline(
  missions,
  (v) => parallel(roles.map((r) => () =>
    agent(r.prompt(v), { label: `${r.key}:${v}`, phase: 'Backfill', agentType: 'general-purpose', schema: DONE_SCHEMA })
  )).then((rs) => ({ version: v, roles: rs.filter(Boolean).map((x) => x.role), files: rs.filter(Boolean).flatMap((x) => x.files || []) })),
)

const ok = results.filter(Boolean)
const failed = missions.filter((v, i) => !results[i] || results[i].roles.length < 4)
log(`done: ${ok.length}/${missions.length} missions; incomplete: ${failed.length ? failed.join(', ') : 'none'}`)
return { completed: ok.length, incomplete: failed, per_mission: ok.map((r) => ({ v: r.version, roles: r.roles.length, files: r.files.length })) }
