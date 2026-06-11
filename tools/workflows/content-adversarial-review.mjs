export const meta = {
  name: 'content-adversarial-review',
  description: 'Parametrized adversarial fact/framing/anchor/structure review of a clone-rewritten content deliverable set (NASA mission pages or any content genus) before pre-tag-gate',
  whenToUse: 'Run after a DECOMPOSE-build (or any clone-rewrite) completes and BEFORE pre-tag-gate. Auditors and the judge are read-only Explore agents; the orchestrator applies every real-fix-now finding in the main context, then runs the mechanical gates. For ship DIFF review use the sibling tools/ship-review/adversarial-ship-review.mjs instead.',
  phases: [
    { title: 'Audit', detail: '2 fact-checkers (claim clusters A/B) + 1 framing/anchor-canonicality + 1 structure/leak' },
    { title: 'Synthesize', detail: 'judge dedupes + independently re-reads + classifies severity, decides fix list' },
  ],
}

// ---------------------------------------------------------------------------
// content-adversarial-review.mjs (v1 — v1.49.1031 Ship 5)
//
// A WORKFLOW-RUNTIME SCRIPT (not a standalone Node CLI). Executed by the Claude
// Code Workflow tool — `Workflow({ scriptPath:
// 'tools/workflows/content-adversarial-review.mjs', args: {...} })` — and uses
// the Workflow globals (agent / parallel / phase / log / args). It is NOT
// imported, typechecked, or unit-tested as a CLI; its drift-guard is
// tests/integration/workflows-library-discipline.test.ts.
//
// PROVENANCE: the generic form of the 11 untracked per-mission
// *-adversarial-review.js clones that reviewed the v1016-v1026 NASA ships
// (AUDIT-2026-06-09 nasa-ops-machinery lens, PROMOTE verdict). The clone chain
// caught defects no mechanical gate could: a physics BLOCKER (v1013 CGRO), a
// terminology MAJOR (v1014 Swift), and 2 MAJOR predecessor-anchor leaks (v1023
// Dawn) — the Dawn catch created the ANCHOR-LEAK guard, which then held 3
// consecutive clean ships (COBE/WMAP/GP-B) but existed in only 3 of 11 clones.
// This file makes the guard and the rotation/continuation flip committed
// invariants instead of clone-selection folklore.
//
// ISOLATION DISCIPLINE (upgrades the untracked clones, matches the committed
// sibling): all four auditors AND the judge run as the read-only `Explore`
// agent type, so they CANNOT mutate the pages under review. Worktree isolation
// is deliberately NOT used (fresh worktree lacks node_modules; probes fail).
//
// PAYLOAD DISCIPLINE (#10406 positive framing): this committed file enumerates
// NO mission vocabulary. Claim payloads, predecessor leak vocabulary, anchors,
// and exceptions all arrive via args (per-mission payload) or are read from the
// MISSION-BRIEF — the brief is the authoritative fact source and every auditor
// must read it first.
//
// args:
//   { mission: string,            // REQUIRED display name, e.g. 'Gravity Probe B'
//     degree: string,             // REQUIRED catalog degree, e.g. '1.217'
//     version: string,            // REQUIRED milestone tag whose NEW-LOCKED stamps are audited, e.g. 'v1026'
//     dir: string,                // REQUIRED pages directory under review
//     brief: string,              // REQUIRED path to MISSION-BRIEF.md (authoritative facts)
//     mode: 'rotation' | 'continuation',  // REQUIRED — flips the predecessor-leak rule
//     canonicalAnchors: string[], // REQUIRED — the ONLY identifiers that may be stamped NEW LOCKED at `version`
//     predecessor: {              // REQUIRED
//       mission: string, degree: string,
//       anchors?: string[],       // predecessor anchors that must NOT be stamped at `version`
//       leakVocab?: string[] },   // predecessor-specific topical vocabulary to scan for
//     cumulativeAnchors?: string[], // cumulative identifiers also allowed in stamps
//     sharedVocab?: string[],     // continuation mode: vocabulary SHARED with the predecessor (never a leak)
//     readme?: string,            // release-notes README path to include in the page set
//     pages?: string[],           // explicit page list; default = canonical page set under dir
//     factFocus?: { a?: string, b?: string }, // extra per-mission focus text for the two fact clusters
//     structureNotes?: string,    // extra structure payload (nav hrefs, shader file + modes, etc.)
//     exceptions?: string[] }     // extra known-correct steady states for the judge allow-list
// ---------------------------------------------------------------------------

// The Workflow runtime may deliver `args` as an object OR a JSON string
// (scriptPath invocations empirically receive the stringified form).
let A = {}
if (args && typeof args === 'object') A = args
else if (typeof args === 'string' && args.trim()) {
  try { A = JSON.parse(args) } catch { A = {} }
}

const REQUIRED = ['mission', 'degree', 'version', 'dir', 'brief', 'mode', 'canonicalAnchors', 'predecessor']
const missing = REQUIRED.filter((k) => A[k] == null || (Array.isArray(A[k]) && !A[k].length))
if (missing.length || !['rotation', 'continuation'].includes(A.mode)) {
  throw new Error(
    `content-adversarial-review: missing/invalid args: ${missing.join(', ') || 'mode'} — required: ` +
    `{ mission, degree, version, dir, brief, mode: 'rotation'|'continuation', canonicalAnchors[], predecessor{mission,degree} }`,
  )
}

const MISSION = A.mission
const DEGREE = A.degree
const VERSION = A.version
const DIR = A.dir
const BRIEF = A.brief
const MODE = A.mode
const PRED = A.predecessor
const CANON = A.canonicalAnchors.concat(A.cumulativeAnchors || [])
const PRED_ANCHORS = Array.isArray(PRED.anchors) ? PRED.anchors : []
const LEAK_VOCAB = Array.isArray(PRED.leakVocab) ? PRED.leakVocab : []
const SHARED_VOCAB = Array.isArray(A.sharedVocab) ? A.sharedVocab : []

// Canonical page set (the page roster of every NASA degree; override via args.pages).
const PAGES_LIST = Array.isArray(A.pages) && A.pages.length
  ? A.pages
  : [
      `${DIR}/index.html`, `${DIR}/research.html`, `${DIR}/organism.html`, `${DIR}/papers.html`,
      `${DIR}/mathematics.html`, `${DIR}/simulation.html`, `${DIR}/curriculum.html`,
      `${DIR}/research.md`, `${DIR}/organism.md`,
    ]
const PAGES = PAGES_LIST.concat(A.readme ? [A.readme] : []).join(', ')

// The rotation/continuation flip (v1026 GP-B handoff gotcha #7, now a committed
// invariant): the SAME predecessor vocabulary is treated oppositely by mode.
const MODE_RULE = MODE === 'rotation'
  ? `MODE = ROTATION (axis opener). ${MISSION} and the predecessor ${PRED.mission} (degree ${PRED.degree}) share essentially NO topical vocabulary — this degree rotates to a different axis. Essentially ALL predecessor topical content carried over from the cloned source is a leak that should have been replaced. The ONLY correct predecessor reference is a SINGLE deliberate nav-prev / lineage note. ${LEAK_VOCAB.length ? `Per-mission leak indicators to scan for (payload, from the brief): ${LEAK_VOCAB.join('; ')}.` : 'Derive the leak vocabulary from the brief and the predecessor pages.'}`
  : `MODE = CONTINUATION (intra-axis). ${MISSION} CONTINUES the same axis as the predecessor ${PRED.mission} (degree ${PRED.degree}), so the axis vocabulary is SHARED and CORRECT — do NOT flag shared axis vocabulary as a leak${SHARED_VOCAB.length ? ` (shared and correct: ${SHARED_VOCAB.join('; ')})` : ''}. Only predecessor-SPECIFIC items are leaks${LEAK_VOCAB.length ? `: ${LEAK_VOCAB.join('; ')}` : ' — derive them from the brief'}.`

const EXCEPTIONS = [
  `A SINGLE deliberate nav-prev card / lineage note referencing the ${PRED.mission} predecessor is correct and expected — not a leak.`,
  `The accepted identifier house style — a descriptive paragraph ending with an "IDENTIFIER obs#N NEW LOCKED at ${VERSION}." tag-sentence — is NOT a defect; flag only mid-sentence grammatical use or non-canonical identifiers.`,
].concat(
  MODE === 'continuation' && SHARED_VOCAB.length
    ? [`Shared axis vocabulary (${SHARED_VOCAB.join('; ')}) is correct for ${MISSION} — never a leak.`]
    : [],
  Array.isArray(A.exceptions) ? A.exceptions.filter((e) => typeof e === 'string' && e.trim()) : [],
)
const exceptionsBlock = `CRITICAL EXCEPTIONS (do NOT flag — known-correct steady states):
${EXCEPTIONS.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`

// Schemas — invariant across all 11 ancestor clones (evidence fleet wf_28691c0e).
const FINDINGS_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['findings'],
  properties: { findings: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['severity', 'file', 'claim', 'problem', 'correction', 'confidence'],
    properties: {
      severity: { type: 'string', enum: ['BLOCKER', 'MAJOR', 'MINOR'] },
      file: { type: 'string' }, claim: { type: 'string' }, problem: { type: 'string' },
      correction: { type: 'string' }, confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    } } } },
}
const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['confirmed', 'summary'],
  properties: { summary: { type: 'string' }, confirmed: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['severity', 'file', 'problem', 'correction', 'verdict'],
    properties: {
      severity: { type: 'string', enum: ['BLOCKER', 'MAJOR', 'MINOR'] },
      file: { type: 'string' }, problem: { type: 'string' }, correction: { type: 'string' },
      verdict: { type: 'string', enum: ['real-fix-now', 'real-minor-optional', 'rejected-false-positive'] },
    } } } },
}

const COMMON = `The deliverable set under review: ${PAGES}. The authoritative content brief is ${BRIEF} — READ IT FIRST; every fact check is against the brief (and internal cross-page consistency), never against your own recall alone.
${MODE_RULE}
${exceptionsBlock}
You are READ-ONLY (Explore): inspect, never modify. Return findings via the schema; an empty findings array is a valid, valuable result. Quote the claim text and name the exact file for every finding.`

phase('Audit')

const auditors = [
  {
    label: 'fact:cluster-a',
    prompt: `You are an adversarial fact-checker for the ${MISSION} (degree ${DEGREE}) content pages. ${COMMON}

YOUR CLUSTER — mission identity, program, launch, vehicle, site, orbit/vantage, management/institutions, principal investigators, axis/lineage claims, and dates/timeline. Verify EVERY such claim on every page against the brief. FLAG any predecessor fact credited to ${MISSION} (a ${PRED.mission} launch date / vehicle / site / institution / vantage surviving the rewrite is the classic leak). FLAG wrong axis, obs#, or rotation numbers, and any claim that contradicts the brief's axis framing. FLAG internal inconsistencies between pages.${A.factFocus && A.factFocus.a ? `\nPER-MISSION FOCUS (payload):\n${A.factFocus.a}` : ''}`,
  },
  {
    label: 'fact:cluster-b',
    prompt: `You are an adversarial fact-checker for the ${MISSION} (degree ${DEGREE}) content pages. ${COMMON}

YOUR CLUSTER — instruments/experiment hardware, measured quantities and numbers, physics/science claims, mathematics pages (verify every formula, scaling relation, and stated value), results and publications, and precision-of-"first"-claims (overreach: flag any claim that inflates the mission's distinction beyond what the brief supports; a correct lineage note is fine). FLAG any predecessor instrument or measured value credited to ${MISSION}. Verify the mathematics page's derivations are dimensionally and physically sound.${A.factFocus && A.factFocus.b ? `\nPER-MISSION FOCUS (payload):\n${A.factFocus.b}` : ''}`,
  },
  {
    label: 'framing:anchor-canonicality',
    prompt: `You are the framing + substrate-anchor auditor for the ${MISSION} (degree ${DEGREE}) content pages. ${COMMON}

CHECK, in priority order:
1. ANCHOR CANONICALITY (HIGH PRIORITY — the ANCHOR-LEAK guard; a real defect of this exact kind shipped at v1023 and was caught by this auditor's ancestor). The ONLY identifiers that may be stamped "... NEW LOCKED at ${VERSION}" anywhere in the page set are: ${CANON.join('; ')}. FLAG as MAJOR any page (especially research.html and research.md) stamping a NON-canonical identifier at ${VERSION} — in particular any predecessor anchor carried over from the cloned source${PRED_ANCHORS.length ? ` (predecessor anchors that must NOT appear as ${VERSION} stamps: ${PRED_ANCHORS.join('; ')})` : ''}. ALSO flag if research.html and research.md stamp DIFFERENT anchor sets from each other — they must be identical. Name the exact file + wrong identifier + the canonical replacement that fits the paragraph subject.
2. POSITIVE FRAMING: the pages describe the mission's measurements, engineering, and results in an engineering-professional register. Flag alarmist or sensational framing.
3. TRIP-VOCAB: note for the main context to run \`node tools/trip-vocab-check.mjs <file> --mode page\` on each HTML page${A.readme ? ' + the README' : ''}; flag any title/heading that obviously concentrates high-risk vocabulary.
4. SINGLE-WORD REPETITION: flag any paragraph where one non-stop-word appears more than ~5 times.
5. DEDICATION: ${A.readme ? `the README dedication paragraph must be <=200 words, engineering-professional, with concrete proper nouns — flag if too long or generic.` : 'if a dedication paragraph exists, it must be <=200 words, engineering-professional, with concrete proper nouns.'}
6. IDENTIFIER HOUSE STYLE: the accepted style ends a descriptive paragraph with an "IDENTIFIER obs#N NEW LOCKED at ${VERSION}." tag-sentence — do NOT flag the pattern itself; flag only mid-sentence grammatical use or non-canonical identifiers (item 1).`,
  },
  {
    label: 'structure:leak-nav-shader',
    prompt: `You are the structural/leak auditor for the ${MISSION} (degree ${DEGREE}) content pages. The ${DIR} directory was COPIED from the ${PRED.mission} (degree ${PRED.degree}) directory and rewritten. ${COMMON}

CHECK:
1. PREDECESSOR LEAK: per the MODE rule above, search every page for residual ${PRED.mission} content that should have been rewritten for ${MISSION} — leftover topical passages, names, dates, instrument references, stale degree numbers describing THIS mission as if it were the predecessor, and stale asset/shader names. Apply the CRITICAL EXCEPTIONS strictly.
2. NAV CARDS: index.html must carry a top AND a bottom nav-pair; nav-prev must point at the ${PRED.degree} predecessor and nav-next at the successor placeholder. Flag missing/broken nav cards, wrong hrefs, and stale self-links.
3. SHADER + ARTIFACTS: the shader file, its mode labels, and every reference to it (index/mathematics/simulation/viewer) must be consistent and rewritten for ${MISSION}; viewer.html must load the correct .frag filename and keep its GLSL version-directive rewrite intact. Flag stale or broken shader references and leftover predecessor shader content.
4. AXIS CLAIMS: every page must state the same axis, obs#, rotation number, degree, and predecessor lineage as the brief. Flag any inconsistency.
5. STRUCTURE: broken internal links, duplicated headings, malformed HTML from the rewrite, and invalid JSON in any data file in the set.${A.structureNotes ? `\nPER-MISSION STRUCTURE PAYLOAD:\n${A.structureNotes}` : ''}`,
  },
]

const auditResults = await parallel(
  auditors.map((a) => () => agent(a.prompt, { label: a.label, phase: 'Audit', schema: FINDINGS_SCHEMA, agentType: 'Explore' })),
)
const allFindings = auditResults.filter(Boolean).flatMap((r) => r.findings || [])
log(`content-adversarial-review: auditors returned ${allFindings.length} raw findings`)

phase('Synthesize')

const judgePrompt = `You are the synthesis judge for an adversarial review of the ${MISSION} (degree ${DEGREE}) content deliverables. Four read-only auditors returned the raw findings below. The authoritative brief is ${BRIEF} — read it. Deliverables: ${PAGES}. The canonical NEW-LOCKED identifier set for ${VERSION} is: ${CANON.join('; ')}.
${MODE_RULE}
${exceptionsBlock}

For EACH finding: independently verify against the brief and the actual files — READ the cited file yourself to confirm the claim is really present as described (never trust an auditor's quote; auditors can hallucinate). Then dedupe findings that describe the same defect; classify severity (BLOCKER = wrong facts/physics/dates/attribution, the mission described as the wrong kind of mission, or a predecessor-specific fact credited to ${MISSION}; MAJOR = a non-canonical or predecessor anchor stamped NEW LOCKED at ${VERSION}, a research.html-vs-research.md anchor-set mismatch, wrong measured values, a real structural defect, or an overreaching distinction claim; MINOR = stylistic). Set verdict per entry: 'real-fix-now', 'real-minor-optional', or 'rejected-false-positive' (explain the rejection evidence in problem). Reject false positives AGGRESSIVELY — a finding that merely restates a CRITICAL EXCEPTION is a false positive. Be specific enough that the main context can apply each fix in one edit (file + exact change + the canonical replacement identifier where relevant).

Raw findings:
${JSON.stringify(allFindings, null, 2)}`

const verdict = await agent(judgePrompt, { label: 'judge:synthesis', phase: 'Synthesize', schema: VERDICT_SCHEMA, agentType: 'Explore' })

// Fail-safe: a dead judge (null) with raw findings must never silently pass the
// review — degrade to treating every raw finding as fix-now for the orchestrator
// to triage by hand.
const confirmed = verdict && Array.isArray(verdict.confirmed)
  ? verdict.confirmed
  : allFindings.map((f) => ({ severity: f.severity, file: f.file, problem: f.problem, correction: f.correction, verdict: 'real-fix-now' }))
if (!verdict) log('content-adversarial-review: JUDGE UNAVAILABLE — fail-safe: all raw findings treated as fix-now')

const fixNow = confirmed.filter((c) => c.verdict === 'real-fix-now')
const blockers = fixNow.filter((c) => c.severity === 'BLOCKER')
log(`content-adversarial-review: judge -> ${fixNow.length} fix-now (${blockers.length} BLOCKER), ${confirmed.length} total classified`)

return { rawCount: allFindings.length, summary: verdict ? verdict.summary : null, fixNow, allConfirmed: confirmed }
