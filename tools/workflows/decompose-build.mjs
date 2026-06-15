export const meta = {
  name: 'decompose-build',
  description: 'Parametrized DECOMPOSE-build: parallel bounded file-rewrite agents (predecessor clone -> new mission content) that beat the ~290s sub-agent ceiling. Rewrites the FULL substrate-era tree — track pages + JSONs + shader AND the artifact tree (story/circuits/sims/audio), the retrospective chain, and the forest module (re-registered in the manifest) — so a forward degree never re-accrues W6 collapse debt.',
  whenToUse: 'Run to rewrite a cloned content directory (NASA degree pages or any clone-rewrite genus) into the new mission. Each task agent rewrites its assigned files in place (keeping filenames so index.html artifact links stay valid) and runs the per-file trip-vocab check; the orchestrator then runs content-adversarial-review.mjs and the mechanical gates. The artifact/retrospective/forest tasks make the result pass nasa-consistency-audit with no separate W6 backfill. Build agents WRITE files (general-purpose), unlike the read-only review/audit skeletons.',
  phases: [{ title: 'Rewrite', detail: 'parallel file-rewrite agents, each rewriting its assigned cloned files in place' }],
}

// ---------------------------------------------------------------------------
// decompose-build.mjs (v1 — v1.49.1031 Ship 5)
//
// A WORKFLOW-RUNTIME SCRIPT (not a standalone Node CLI). Executed by the Claude
// Code Workflow tool — `Workflow({ scriptPath:
// 'tools/workflows/decompose-build.mjs', args: {...} })` — and uses the
// Workflow globals (agent / parallel / phase / log / args). Drift-guard:
// tests/integration/workflows-library-discipline.test.ts.
//
// PROVENANCE: the generic form of the 6 untracked per-mission
// *-build-decomposed.js clones (v1021 Magellan -> v1026 GP-B). DECOMPOSE-build
// beats the ~290s sub-agent ceiling: 8/8 agents ok, ~350s total wall-clock,
// zero ceiling deaths, confirmed 6x (AUDIT-2026-06-09 nasa-ops-machinery lens).
// It supersedes the #10408 single-dispatch rebuild template for catalog-clone
// rewrites (Lead A; see docs/nasa-mission-authoring-discipline.md).
//
// The ANCHORS guard (args.anchorsBlock, REQUIRED) and the rotation-vs-
// continuation SHARED-prompt flip (args.mode, REQUIRED) are committed
// invariants here — in the untracked clone chain they existed in only 3 of 6
// builds and one handoff paragraph, and cloning an older ancestor silently
// regressed them.
//
// PAYLOAD DISCIPLINE (#10406 positive framing): this committed file enumerates
// NO mission vocabulary. Facts, anchors, axis framing, organism pairing,
// shader spec, and leak-replacement guidance arrive via args blocks authored
// per-mission from MISSION-BRIEF.md — the brief stays the authoritative source
// and every task agent must read it first.
//
// W6-DEBT CLOSURE (2026-06-15): the original 8 tasks rewrote only the track
// pages + JSONs + shader, silently dropping the substrate-era artifact tree
// (story/circuits/sims/audio), the retrospective chain, and the forest module
// — so every forward degree shipped collapsed and had to be W6-backfilled
// later. The artifacts-*/retro-forest tasks below close that gap: a forward
// degree now clones a post-backfill predecessor (1.220+, full NASA-1.150
// shape) and rewrites the WHOLE tree in place, KEEPING cloned filenames (so
// index.html's artifact links stay valid with zero slug coordination) and
// re-running tools/nasa-forest-manifest-regen.mjs so the new module loads. The
// result passes tools/nasa-consistency-audit.mjs (now a ship-gate BLOCKER) on
// the artifact-count, forest-in-manifest, and retrospective-chain invariants.
//
// args:
//   { mission: string,             // REQUIRED, e.g. 'Gravity Probe B'
//     degree: string,              // REQUIRED, e.g. '1.217'
//     version: string,             // REQUIRED milestone tag for NEW-LOCKED stamps, e.g. 'v1026'
//     dir: string,                 // REQUIRED pages directory (the cloned tree to rewrite)
//     brief: string,               // REQUIRED path to MISSION-BRIEF.md
//     mode: 'rotation' | 'continuation',  // REQUIRED — flips the predecessor-vocab rule
//     predecessor: { mission: string, degree: string },  // REQUIRED (the clone source)
//     successorDegree: string,     // REQUIRED for the to-pointer, e.g. '1.218'
//     anchorsBlock: string,        // REQUIRED — full ANCHORS text: "use ONLY these N; do NOT carry predecessor anchors"
//     axisBlock: string,           // REQUIRED — AXIS / ENGINE statement (axis, obs#, rotation#, engine counters)
//     organismBlock: string,       // REQUIRED — organism pairing payload
//     shaderBlock: string,         // REQUIRED — shader filename + 4-mode spec (one consistent name across all tasks)
//     factsBlock?: string,         // VERIFIED FACTS block (brief remains authoritative; this reinforces)
//     leakNote?: string,           // per-mission replacement guidance for DISCIPLINE (e)
//     nav?: { prevHref, prevLabel, nextHref, nextLabel },  // index.html nav-card payload
//     readme?: { path, modelPath },// release-notes README task payload (task skipped if absent)
//     taskNotes?: { [label]: string },  // extra per-task payload appended to that task's prompt
//     tasks?: [{ label, prompt }] }    // full roster override (SHARED is still prepended)
// ---------------------------------------------------------------------------

let A = {}
if (args && typeof args === 'object') A = args
else if (typeof args === 'string' && args.trim()) {
  try { A = JSON.parse(args) } catch { A = {} }
}

const REQUIRED = ['mission', 'degree', 'version', 'dir', 'brief', 'mode', 'predecessor', 'successorDegree', 'anchorsBlock', 'axisBlock', 'organismBlock', 'shaderBlock']
const missing = REQUIRED.filter((k) => A[k] == null || A[k] === '')
if (missing.length || !['rotation', 'continuation'].includes(A.mode)) {
  throw new Error(
    `decompose-build: missing/invalid args: ${missing.join(', ') || 'mode'} — required: ` +
    `{ mission, degree, version, dir, brief, mode: 'rotation'|'continuation', predecessor{mission,degree}, successorDegree, anchorsBlock, axisBlock, organismBlock, shaderBlock }`,
  )
}

const MISSION = A.mission
const DEGREE = A.degree
const VERSION = A.version
const DIR = A.dir
const BRIEF = A.brief
const PRED = A.predecessor

// The rotation/continuation flip — the load-bearing mode invariant. For a
// ROTATION the predecessor vocabulary is NOT shared and essentially everything
// topical must be replaced; for a CONTINUATION the axis vocabulary is shared
// and only predecessor-specific content changes.
const MODE_NOTE = A.mode === 'rotation'
  ? `TOPIC-CHANGE NOTE (ROTATION / AXIS OPENER): ${MISSION} and the ${PRED.mission} source share almost NO subject vocabulary — this is a rotation to a different axis, not a continuation. Nearly EVERY content word from the ${PRED.mission} source must be replaced. The predecessor's topical vocabulary is NOT shared here: remove ALL of it except a single deliberate nav-prev / lineage note. The only things shared with the source are generic catalog scaffolding (card layout, the "NASA degree" framing, and whatever the brief explicitly marks as shared).`
  : `TOPIC-CHANGE NOTE (CONTINUATION / INTRA-AXIS): ${MISSION} CONTINUES the same axis as the ${PRED.mission} source, so the axis vocabulary is SHARED and CORRECT — keep it. Replace only the predecessor-SPECIFIC content (the source mission's own facts, instruments, dates, people, and asset names) with ${MISSION} content; the brief marks which items are shared versus predecessor-specific.`

const SHARED = `You are rewriting cloned files inside the current repository working tree. The files in ${DIR}/ were copied from the ${PRED.mission} (degree ${PRED.degree}) directory and currently contain ${PRED.mission} content. Your job: rewrite the TEXTUAL CONTENT of your assigned file(s) to ${MISSION} (degree ${DEGREE}), preserving the HTML/JSON/markdown STRUCTURE, CSS, card layout, and nav-card patterns EXACTLY — swap only the content.

${MODE_NOTE}

REQUIRED: first read ${BRIEF} (the authoritative ${MISSION} brief — all facts, substrate anchors, engine state, organism pairing, dedication guidance, and discipline are there). Then read your assigned source file(s) to learn the structure, then rewrite in place with Edit/Write.
${A.factsBlock ? `\nVERIFIED FACTS (use exactly; do not contradict):\n${A.factsBlock}\n` : ''}
AXIS / ENGINE: ${A.axisBlock}
${A.anchorsBlock}
ORGANISM PAIRING: ${A.organismBlock}
SHADER (must be consistent across index/math/sim/shader files): ${A.shaderBlock}

DISCIPLINE: (a) Positive framing — describe the mission's measurements, engineering, and results in an engineering-professional register; the brief carries the mission-specific framing guidance. (b) Dedication paragraphs <=200 words, engineering-professional, concrete proper nouns. (c) Any single non-stop-word <=5 times per paragraph — diversify the vocabulary. (d) Substrate-anchor identifiers belong in lists/table-cells/pills or end-of-paragraph "IDENTIFIER obs#N NEW LOCKED at ${VERSION}." tag-sentences, NOT mid-sentence as grammatical subjects. Use ONLY the canonical anchors above — do NOT carry over any predecessor anchors; those describe the predecessor, not ${MISSION}. (e) Replace predecessor content per the TOPIC-CHANGE NOTE above${A.leakNote ? ` — per-mission replacement guidance: ${A.leakNote}` : ''} — EXCEPT a SINGLE deliberate nav-prev / lineage reference to the ${PRED.degree} ${PRED.mission} predecessor, which is correct and expected.

Do NOT commit/tag/push/FTP/bump-version. Only edit your assigned files. After rewriting, if your files include .html, run \`node tools/trip-vocab-check.mjs <file> --mode page\` and confirm VERDICT PASS. Return a SHORT (1-3 line) confirmation listing the files you rewrote + any trip-vocab verdict + any anomaly.`

const NAV = A.nav || {
  prevHref: `../${PRED.degree}/`, prevLabel: `v${PRED.degree} ${PRED.mission}`,
  nextHref: `../${A.successorDegree}/`, nextLabel: `v${A.successorDegree} ->`,
}

// The page decomposition — the 7 track/JSON/shader tasks (identical across all
// 6 ancestor clones, evidence fleet wf_28691c0e) plus the 4 artifact/forest/
// retro tasks that close W6 collapse debt. Each task is one bounded sub-5-min
// agent. EXEMPLAR is the substrate-era structural gold standard (NASA 1.150),
// a sibling of the degree dir — used as the "model on" fallback when a clone
// predates the artifact tree.
const EXEMPLAR = `${DIR}/../1.150`
const note = (label) => (A.taskNotes && A.taskNotes[label] ? `\n\nPER-MISSION NOTES (payload):\n${A.taskNotes[label]}` : '')
const DEFAULT_TASKS = [
  {
    label: 'index.html',
    prompt: `ASSIGNED FILE: ${DIR}/index.html (the largest, most structured file). Rewrite to ${MISSION}, preserving the canonical card layout EXACTLY: the 12-card v1.0 floor + Mission Journey narrative card (>500 words, told from the brief's mission narrative) + Structural Firsts card + Governance & Chain Declarations card + the numbered resonance axes each with a mission paragraph and an organism pairing + the sidebar lineage table + a haiku card. NAV-CARD PAIRS (both top AND bottom): previous cell -> ${NAV.prevHref} "${NAV.prevLabel}"; next cell -> ${NAV.nextHref} "${NAV.nextLabel}". Reference the shader exactly as specified in the SHARED spec. Use ONLY the canonical anchors. Dedication card <=200 words. ARTIFACT-LINK INTEGRITY: the artifact files keep their cloned filenames (rewritten in place by the artifacts-*/retro-forest tasks), so KEEP the Creative Artifacts / Runnable Simulations / Interactive Lab / Data Files cards linking the SAME artifacts/... paths the clone already used — every href="artifacts/..." must resolve to a file that exists in ${DIR}/artifacts/; introduce no dead artifact links and leave at least the existing artifact links in place. Run the trip-vocab page check and confirm PASS.${note('index.html')}`,
  },
  {
    label: 'research',
    prompt: `ASSIGNED FILES: ${DIR}/research.html AND ${DIR}/research.md. Rewrite both to ${MISSION} deep-research content from the brief: the mission's full scientific story, instruments, measured results, history, and its place in the axis lineage. If the template has a predecessor comparison/lineage table, keep the prior-axis facts in the prior-axis row. CRITICAL: use ONLY the canonical anchors when stamping "NEW LOCKED at ${VERSION}" tag-sentences — do NOT carry over any predecessor anchor identifiers from the source page. Each anchor stamped in research.html MUST also appear identically in research.md. Run the trip-vocab page check on research.html and confirm PASS.${note('research')}`,
  },
  {
    label: 'organism',
    prompt: `ASSIGNED FILES: ${DIR}/organism.html AND ${DIR}/organism.md. Rewrite to the organism pairing in the SHARED spec. organism.html must be >=3500 words with FOUR explicit alignments between the organisms' behaviors/forms and the mission's engineering (behavioral-description-only framing), a behavioral-observation-notes section, and a dedication <=200 words. organism.md is the shorter markdown companion. Run the trip-vocab page check on organism.html and confirm PASS.${note('organism')}`,
  },
  {
    label: 'math-sim',
    prompt: `ASSIGNED FILES: ${DIR}/mathematics.html AND ${DIR}/simulation.html. mathematics.html threads the mission's quantitative story from the brief (the governing equations/scalings, the measured values, and what precision the measurement needed) — every formula must be dimensionally and physically sound. simulation.html: reference the shader exactly as specified in the SHARED spec (filename + its 4 modes). Run the trip-vocab page check on BOTH and confirm PASS.${note('math-sim')}`,
  },
  {
    label: 'papers-curriculum',
    prompt: `ASSIGNED FILES: ${DIR}/papers.html AND ${DIR}/curriculum.html. Rewrite both to ${MISSION}: papers.html = the key primary references and reading from the brief; curriculum.html = a learning path through the mission's scientific domain and technologies. Run the trip-vocab page check on BOTH and confirm PASS.${note('papers-curriculum')}`,
  },
  {
    label: 'jsons',
    prompt: `ASSIGNED FILES: ${DIR}/degree-sync.json, ${DIR}/knowledge-nodes.json, ${DIR}/data-sources.json. Rewrite all three to ${MISSION}, preserving the JSON SCHEMA/KEYS exactly (same structure as the ${PRED.mission} source) — swap values to degree ${DEGREE}, the axis/obs framing from the SHARED spec, the canonical substrate anchors, mission-appropriate knowledge nodes, and the mission's data sources from the brief. Ensure all three remain VALID JSON (verify with \`node -e "require('./<path>')"\` for each).${note('jsons')}`,
  },
  {
    label: 'pointers-shader',
    prompt: `ASSIGNED FILES: ${DIR}/from-${PRED.degree}.md, ${DIR}/to-${A.successorDegree}.md, plus the shader files under ${DIR}/artifacts/shaders/ per the SHARED spec.
- from-${PRED.degree}.md: rewrite as the backward retrospective chain — predecessor = ${PRED.degree} ${PRED.mission}; this degree = ${DEGREE} ${MISSION}; frame the axis lineage per the SHARED AXIS/ENGINE block. A comparison table across way-of-seeing, instrument, vantage, key result is welcome.
- to-${A.successorDegree}.md: rewrite as forward-anticipation per the brief's forward-queue guidance.
- Retheme the GLSL fragment shader to the 4 modes in the SHARED spec; keep it valid GLSL 3.30 core; replace any leftover predecessor shader content.
- viewer.html: update the 4 mode labels + the shader fetch to the new .frag filename; KEEP the \`#version 330 core\` -> \`#version 300 es\` load-time rewrite intact.${note('pointers-shader')}`,
  },
  {
    label: 'artifacts-story-audio',
    prompt: `ASSIGNED FILES: every file under ${DIR}/artifacts/story/ AND ${DIR}/artifacts/audio/ (cloned from ${PRED.mission}; substrate-era NASA 1.150 shape = story/{slug}.html + {slug}.tex, audio/{mission}-synth.dsp + {species}.dsp). REWRITE each cloned file in place to ${MISSION}, KEEPING THE EXISTING FILENAMES (index.html links artifacts by name — renaming breaks those links and trips the audit's dead-link check).
- story .html: creative nonfiction (2500-4000 words) weaving ${MISSION} + its paired animal + paired plant into one factual narrative; same dark-theme <style> idiom.
- story .tex: the XeLaTeX companion (article + amsmath + hyperref + geometry + fancyhdr), same piece.
- audio .dsp files: Faust DSP — one for the mission's audio signature (launch/telemetry/maneuver events), one for the paired species' sound; declared params + comments.
Engineering/naturalist register; behavioral-description-only for organisms; real ${MISSION} hardware/dates/species from the brief; canonical anchors only. If the story/ or audio/ dir (or a file) is ABSENT in the clone (a predecessor predating the artifact tree), AUTHOR it fresh modeled on ${EXEMPLAR}/artifacts/{story,audio}/ using 1.150's canonical filenames, and list any newly-created file in your return. Run \`node tools/trip-vocab-check.mjs <story.html> --mode page\` and confirm VERDICT PASS.${note('artifacts-story-audio')}`,
  },
  {
    label: 'artifacts-circuits',
    prompt: `ASSIGNED FILES: every file under ${DIR}/artifacts/circuits/ (cloned from ${PRED.mission}; NASA 1.150 shape = {slug}.cir + {slug}.md + {slug}.html). REWRITE each in place to ONE real ${MISSION}-era instrument/sensor/subsystem, KEEPING THE EXISTING FILENAMES.
- .cir: ngspice netlist (80-200 lines), runnable + commented, real component values where known (placeholders clearly commented otherwise).
- .md: design doc (200-500 lines) — schematic description, parts list, operating principle, modern DIY equivalent.
- .html: self-contained dark-theme design-doc page (~120 lines; meta block, tables, diagram block) — a standalone page, NOT a harness loader.
Pick a ${MISSION}-specific subsystem from the brief; canonical anchors only. If the circuits/ dir is ABSENT, author fresh modeled on ${EXEMPLAR}/artifacts/circuits/ using 1.150's canonical filenames, and list new files in your return. Run \`node tools/trip-vocab-check.mjs <circuits.html> --mode page\` and confirm VERDICT PASS.${note('artifacts-circuits')}`,
  },
  {
    label: 'artifacts-sims',
    prompt: `ASSIGNED FILES: every file under ${DIR}/artifacts/sims/ (cloned from ${PRED.mission}; NASA 1.150 shape = two .py + one interactive .html). REWRITE each in place to ${MISSION}, KEEPING THE EXISTING FILENAMES.
- analytical .py: Python 3 + numpy + matplotlib (200-400 lines) — a ${MISSION}-specific analytical sim (trajectory/orbit/instrument response); runnable, docstring + plots, real parameters.
- explorer .py: a second sim (retrieval / parameter-fit / data explorer), 200-400 lines.
- interactive .html: standalone HTML+canvas/SVG visualization (300-500 lines) — mission event sequence OR paired-species visualization; self-contained, no external deps.
Real ${MISSION} parameters from the brief; canonical anchors only. If the sims/ dir is ABSENT, author fresh modeled on ${EXEMPLAR}/artifacts/sims/ using 1.150's canonical filenames, and list new files in your return. Run \`node tools/trip-vocab-check.mjs <interactive.html> --mode page\` and confirm VERDICT PASS.${note('artifacts-sims')}`,
  },
  {
    label: 'retro-forest',
    prompt: `ASSIGNED FILES: ${DIR}/retrospective/lessons-carryover.json, ${DIR}/retrospective/corpus-deltas.md, AND the forest module under ${DIR}/forest-module/ (the *.js module). REWRITE each in place to ${MISSION}, KEEPING THE EXISTING FILENAMES.
- retrospective/lessons-carryover.json: { "missionVersion":"${DEGREE}", "predecessor":"${PRED.degree}", "readFromPredecessor":"<path or note>", "appliedLessons":[{"id","summary","applicationInThisMission"}], "newLessons":[{"id","summary","carryForwardTo":[...],"scope"}], "corpusDeltaHints":[...] } — >=1 applied + >=1 new lesson grounded in ${MISSION}'s real engineering/science. Valid JSON.
- retrospective/corpus-deltas.md: 300-800 words on what ${MISSION} reveals about earlier missions, with explicit retrofit hints.
- forest-module/*.js: rewrite the forest-simulation module to ${MISSION}'s paired species per the brief's organism pairing (plant -> lsystem/physarum/circadian; animal -> boids/audio/kuramoto). Keep it valid JS with the SAME module export shape as the clone.
If any of these are ABSENT in the clone, author them fresh modeled on ${EXEMPLAR}/retrospective/ and ${EXEMPLAR}/forest-module/ using canonical filenames.
FINALLY, from the repository root run \`node tools/nasa-forest-manifest-regen.mjs\` so degree ${DEGREE}'s forest module is registered in www/tibsfox/com/Research/NASA/_harness/v1.0.0/forest-module-manifest.json (a module not in the manifest does not load); confirm ${DEGREE} now appears. Return the files written + the manifest confirmation.${note('retro-forest')}`,
  },
]
if (A.readme && A.readme.path) {
  DEFAULT_TASKS.push({
    label: 'readme',
    prompt: `ASSIGNED FILE: ${A.readme.path} (CREATE it — mkdir -p its directory first if needed).${A.readme.modelPath ? ` Model its structure on ${A.readme.modelPath} (read it for the rubric).` : ''} Full canonical sections: header (Shipped date, Branch, Type, Mission, Engine state), Summary, Mission Overview table, Key Features table, Structural firsts, Substrate Primary Axes (NEW LOCKED + CUMULATIVE + ESTABLISHED), Part A deliverables, Part B catalog deliverables, Decisions Made, Lessons Learned, Surprises, Retrospective (What Worked / What Could Be Better), Cross-References table, Engine state, Forward queue, File inventory, Engine Position, Dedication (<=200 words). Reflect the axis framing from the SHARED spec. Use ONLY the canonical anchors. Do NOT run chapter-gen (main context handles that).${note('readme')}`,
  })
}

const tasks = Array.isArray(A.tasks) && A.tasks.length ? A.tasks : DEFAULT_TASKS

phase('Rewrite')
const results = await parallel(
  tasks.map((t) => () => agent(`${SHARED}\n\n${t.prompt}`, { label: t.label, phase: 'Rewrite', agentType: 'general-purpose' })),
)
const done = results.map((r, i) => ({ task: tasks[i].label, ok: r != null, note: typeof r === 'string' ? r.slice(0, 600) : r }))
log(`decompose-build: rewrite agents complete: ${done.filter((d) => d.ok).length}/${tasks.length} ok`)
return { done }
