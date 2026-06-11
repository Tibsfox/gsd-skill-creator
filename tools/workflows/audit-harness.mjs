export const meta = {
  name: 'audit-harness',
  description: 'Parametrized multi-wave retrospective-audit harness: scout -> adversarial prior-claim verification -> coverage/surfaces -> lenses -> fresh-claim refutation -> completeness critic -> budget-gated gap-fill -> in-workflow synthesis',
  whenToUse: 'Run for periodic core retrospective audits (the 2026-06-03 and 2026-06-09 audits are the proven instances). Audit-specific scope arrives via args specs; the harness pins the proven topology: every wave of fresh claims gets adversarially refuted, a completeness critic hunts gaps, and synthesis writes the draft + results.json + run manifest inside the workflow. All agents are read-only on the repo except their one assigned notes file.',
  phases: [
    { title: 'Scout', detail: 'live surface counts + ground truth (kills hardcoded-count rot)' },
    { title: 'Verify-Prior', detail: 'refute load-bearing prior-audit claims against disk' },
    { title: 'Coverage', detail: 'new-territory coverage agents' },
    { title: 'Surfaces', detail: 'surface refresh agents' },
    { title: 'Lenses', detail: 'cross-cutting lens agents (read wave-A notes)' },
    { title: 'Verify-New', detail: "refute this run's fresh claims" },
    { title: 'Critic', detail: 'completeness checks + cross-note conflict table' },
    { title: 'Gap-fill', detail: 'budget-gated agents for critic-identified gaps' },
    { title: 'Synthesis', detail: 'draft final doc + results.json + run manifest' },
  ],
}

// ---------------------------------------------------------------------------
// audit-harness.mjs (v1 — v1.49.1031 Ship 5)
//
// A WORKFLOW-RUNTIME SCRIPT (not a standalone Node CLI). Executed by the Claude
// Code Workflow tool — `Workflow({ scriptPath:
// 'tools/workflows/audit-harness.mjs', args: {...} })` — and uses the Workflow
// globals (agent / parallel / phase / log / args / budget). Drift-guard:
// tests/integration/workflows-library-discipline.test.ts.
//
// PROVENANCE: the generic form of the untracked audit `_workflow.mjs` harnesses
// that ran the 2026-06-03 and 2026-06-09 core retrospective audits
// (AUDIT-2026-06-09 nasa-ops-machinery lens, PROMOTE verdict). The topology's
// load-bearing properties, now committed invariants:
//   - a SCOUT derives live counts at dispatch so no agent inherits hardcoded
//     stale numbers;
//   - EVERY wave of fresh claims is adversarially refuted (verdicts
//     CONFIRMED | REFUTED | UNVERIFIABLE) — including the lenses, which the
//     2026-06-03 run never verified;
//   - a COMPLETENESS CRITIC reconciles cross-note conflicts and emits
//     self-contained gap-fill tasks, run only if budget remains;
//   - SYNTHESIS writes the draft doc + results.json + run manifest in-workflow
//     so a context reset cannot strand the run's findings.
//
// args:
//   { name: string,               // REQUIRED short run name, e.g. 'core-audit-2026-09'
//     auditDir: string,           // REQUIRED notes/output dir, e.g. '.planning/audit-2026-09-15'
//     scopeNote: string,          // REQUIRED scope paragraph (what is audited, what is excluded)
//     priorDoc?: string,          // prior final audit doc (refuters target it)
//     priorNotesDir?: string,     // prior per-agent notes dir
//     keySources?: string,        // grep-first source map paragraph for all agents
//     scoutExtras?: string,       // extra count derivations appended to the scout prompt
//     refuteSpecs?:  [{ label, file, slice }],   // prior-claim domains to refute
//     coverageSpecs?: [{ label, file, task, era?: boolean }],  // new-territory tasks (era: true => 0-10 score required)
//     surfaceSpecs?: [{ label, file, task, era?: boolean }],   // surface-refresh tasks
//     lensSpecs?:    [{ label, file, task, tracker?: boolean }], // cross-cutting lenses (tracker: true => per-item statuses)
//     synthesisSpec?: string,     // extra synthesis instructions (doc shape, required sections)
//     gapFillFloor?: number }     // min remaining budget tokens to run gap-fill (default 150000)
//   At least one of refuteSpecs / coverageSpecs / surfaceSpecs / lensSpecs is REQUIRED.
// ---------------------------------------------------------------------------

let A = {}
if (args && typeof args === 'object') A = args
else if (typeof args === 'string' && args.trim()) {
  try { A = JSON.parse(args) } catch { A = {} }
}

const specsGiven = ['refuteSpecs', 'coverageSpecs', 'surfaceSpecs', 'lensSpecs'].some((k) => Array.isArray(A[k]) && A[k].length)
const missing = ['name', 'auditDir', 'scopeNote'].filter((k) => !A[k])
if (missing.length || !specsGiven) {
  throw new Error(
    `audit-harness: missing args: ${missing.join(', ')}${specsGiven ? '' : ' + at least one of refuteSpecs/coverageSpecs/surfaceSpecs/lensSpecs'} — ` +
    `required: { name, auditDir, scopeNote, <specs> }. A generic audit cannot invent its scope.`,
  )
}

const N = A.auditDir
const REFUTES = A.refuteSpecs || []
const COVERAGE = A.coverageSpecs || []
const SURFACES = A.surfaceSpecs || []
const LENSES = A.lensSpecs || []
const GAP_FLOOR = typeof A.gapFillFloor === 'number' ? A.gapFillFloor : 150000

// ---------------------------------------------------------------------------
// Retry-once wrapper: agent() returns null on skip/terminal-error; also catch.
// ---------------------------------------------------------------------------
async function run(prompt, opts) {
  let r = null
  try { r = await agent(prompt, opts) } catch (e) { r = null }
  if (r) return { ...r, _label: opts.label }
  log(`retrying ${opts.label} (first attempt failed)`)
  try { r = await agent(prompt, opts) } catch (e) { r = null }
  return r ? { ...r, _label: opts.label } : { _label: opts.label, _failed: true }
}

// ---------------------------------------------------------------------------
// Schemas (per-role variants around a shared core) — proven across both runs.
// ---------------------------------------------------------------------------
const baseProps = {
  unit: { type: 'string' },
  headline: { type: 'string', description: 'one-sentence verdict' },
  keyFindings: { type: 'array', items: { type: 'string' }, description: '5-12 evidence-bearing bullets' },
  numbers: { type: 'array', items: { type: 'string' }, description: 'load-bearing counts as "label: value"' },
  openItems: { type: 'array', items: { type: 'string' } },
  notesFile: { type: 'string' },
}
const BASE = { type: 'object', additionalProperties: false, required: ['unit', 'headline', 'keyFindings', 'notesFile'], properties: baseProps }
const ERA = { ...BASE, required: [...BASE.required, 'score'], properties: { ...baseProps, score: { type: 'number', description: '0-10 vision-alignment' } } }
const TRACKER = {
  ...BASE, required: [...BASE.required, 'trackedItems'],
  properties: {
    ...baseProps,
    trackedItems: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'status', 'evidence'],
        properties: { id: { type: 'string' }, status: { type: 'string', description: 'DONE | PARTIAL | NOT_DONE | SUPERSEDED | FORMAL-DEFER' }, evidence: { type: 'string' } },
      },
    },
  },
}
const REFUTER = {
  type: 'object', additionalProperties: false, required: ['unit', 'headline', 'claimsChecked', 'notesFile'],
  properties: {
    unit: baseProps.unit, headline: baseProps.headline, notesFile: baseProps.notesFile,
    claimsChecked: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['claim', 'verdict', 'evidence'],
        properties: {
          claim: { type: 'string' },
          verdict: { type: 'string', description: 'CONFIRMED | REFUTED | UNVERIFIABLE' },
          evidence: { type: 'string' },
          correction: { type: 'string', description: 'if REFUTED: the corrected fact' },
        },
      },
    },
  },
}
const CRITIC = {
  type: 'object', additionalProperties: false, required: ['headline', 'conflicts', 'gaps', 'notesFile'],
  properties: {
    headline: baseProps.headline, notesFile: baseProps.notesFile,
    checksRun: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'string' }, description: 'cross-note contradictions needing synthesis adjudication' },
    gaps: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['gap', 'task'],
        properties: { gap: { type: 'string' }, task: { type: 'string', description: 'self-contained prompt for a gap-fill agent' } },
      },
    },
  },
}
const SCOUT = {
  type: 'object', additionalProperties: false, required: ['headSha', 'headTag', 'runDate', 'counts', 'notes'],
  properties: {
    headSha: { type: 'string' }, headTag: { type: 'string' },
    runDate: { type: 'string', description: 'today via the date command, YYYY-MM-DD' },
    counts: { type: 'array', items: { type: 'string' }, description: 'every derived live count as "label: value"' },
    notes: { type: 'array', items: { type: 'string' }, description: 'anomalies seen while counting' },
  },
}
const SYNTH = {
  type: 'object', additionalProperties: false, required: ['headline', 'draftFile', 'resultsFile', 'manifestFile', 'nextShips'],
  properties: {
    headline: baseProps.headline,
    draftFile: { type: 'string' }, resultsFile: { type: 'string' }, manifestFile: { type: 'string' },
    composite: { type: 'string', description: 'composite score statement' },
    nextShips: { type: 'array', items: { type: 'string' } },
  },
}

// ---------------------------------------------------------------------------
// Phase 0 — Scout (live counts; kills hardcoded-count rot)
// ---------------------------------------------------------------------------
phase('Scout')
const scout = await run(`READ-ONLY recon for the "${A.name}" audit harness (you are inside the repo). Derive live ground truth:
- headSha (git rev-parse --short HEAD), headTag (git describe --tags --abbrev=0), runDate (date +%F).
- Every live count an auditor would otherwise hardcode: shipped-milestone total, installed/source skill + agent + team counts, src module count, gate step count, discipline/lesson counts — derive each from disk and return as "label: value" strings in counts[].
${A.scoutExtras ? `- Audit-specific derivations:\n${A.scoutExtras}` : ''}
Rules: do NOT write anything; do NOT pass paths under .claude/skills/ as Bash arguments beyond a plain "ls .claude/skills" of the directory itself. Put any count ambiguity or drift you notice in notes[].`,
  { label: 'scout', phase: 'Scout', schema: SCOUT, model: 'sonnet', agentType: 'Explore' })

if (!scout || scout._failed) {
  log('Scout failed twice — aborting (all downstream context depends on live counts).')
  return { error: 'scout failed', scout }
}
log(`Scout: HEAD ${scout.headTag}@${scout.headSha}, ${scout.counts.length} live counts`)

// ---------------------------------------------------------------------------
// Shared context (built from live scout data, not hardcoded)
// ---------------------------------------------------------------------------
const CTX = `You are one agent in the multi-wave "${A.name}" retrospective audit (you are inside the repo).

LIVE GROUND TRUTH (derived at dispatch, ${scout.runDate}): HEAD = ${scout.headTag} @ ${scout.headSha}.
${scout.counts.map((c) => `- ${c}`).join('\n')}

${A.priorDoc ? `PRIOR AUDIT (your job is to UPDATE/VERIFY/EXTEND, not duplicate): final doc ${A.priorDoc}${A.priorNotesDir ? `; per-agent notes ${A.priorNotesDir}/` : ''}.` : ''}

SCOPE: ${A.scopeNote}
${A.keySources ? `\nKEY SOURCES (grep first, read selectively): ${A.keySources}` : ''}

HARD RULES:
- READ-ONLY on the repo. The ONLY file you may write is your one notes file under ${N}/.
  No git add/commit/mutating commands. Targeted single-file test runs (npx vitest run <file>) are
  allowed for verification; never the full suite.
- self-mod-guard: do NOT pass file paths under .claude/skills/ as Bash arguments; "ls .claude/skills"
  of the directory is fine; use the Read tool for skill file contents.
- Evidence-driven: every claim ties to a version, file path, test, count, or lesson ID.
- Distinguish SHIPPED-and-WIRED (live actuator + gate) from SHIPPED-but-shelfware (default-off / no
  real caller). "Wired" must be verified by reading the CALLER, ideally by running.

OUTPUT CONTRACT (both channels required):
1. Write detailed findings to your notes file under ${N}/ (markdown, well-structured, evidence-cited).
2. Return the structured object. keyFindings = your most important evidence-bearing bullets.
   notesFile = the exact path you wrote.`

// ---------------------------------------------------------------------------
// Wave A — Verify-Prior + Coverage + Surfaces, all independent, one parallel batch
// ---------------------------------------------------------------------------
const refuteThunks = REFUTES.map((s) => () => run(`${CTX}

YOUR TASK — ADVERSARIAL VERIFICATION of the PRIOR audit. You are a skeptic; your job is to REFUTE.
Claim domain: ${s.slice}
Extract at least 10 load-bearing, checkable claims from that domain. For each, attempt refutation against
the repo at HEAD: read the cited files/callers, check version evidence via git log/show on tags, run a
targeted test if cited. Verdict per claim: CONFIRMED (evidence holds at HEAD) | REFUTED (give the
correction) | UNVERIFIABLE (say what would be needed). Prioritize claims whose falseness would change a
score, a status, or a recommendation.
Write notes to ${N}/${s.file}.`,
  { label: s.label, phase: 'Verify-Prior', schema: REFUTER }))

const coverageThunks = COVERAGE.map((s) => () => run(`${CTX}

YOUR TASK — ${s.task}
Write notes to ${N}/${s.file}.`,
  { label: s.label, phase: 'Coverage', schema: s.era ? ERA : BASE }))

const surfaceThunks = SURFACES.map((s) => () => run(`${CTX}

YOUR TASK — ${s.task}
Write notes to ${N}/${s.file}.`,
  { label: s.label, phase: 'Surfaces', schema: s.era ? ERA : BASE }))

phase('Verify-Prior')
log(`Wave A: ${refuteThunks.length} prior-claim refuters + ${coverageThunks.length} coverage + ${surfaceThunks.length} surface agents (parallel)`)
const waveA = await parallel([...refuteThunks, ...coverageThunks, ...surfaceThunks])
const waveAok = waveA.filter((r) => r && !r._failed)
log(`Wave A complete: ${waveAok.length}/${waveA.length} delivered`)
const waveANotes = [...COVERAGE, ...SURFACES].map((s) => `${N}/${s.file}`)

// ---------------------------------------------------------------------------
// Wave B — Lenses (read wave-A notes) + refute wave-A fresh claims
// ---------------------------------------------------------------------------
const lensThunks = LENSES.map((s) => () => run(`${CTX}

The FRESH wave-A notes exist now under ${N}/ (${waveANotes.join(', ')}) — read the ones your task names.

YOUR TASK — ${s.task}
Write notes to ${N}/${s.file}.`,
  { label: s.label, phase: 'Lenses', schema: s.tracker ? TRACKER : BASE }))

// Generic fresh-claim refuters: split the wave-A coverage+surface notes across
// up to 2 refuters (every fresh claim wave gets adversarially verified).
const half = Math.ceil(waveANotes.length / 2)
const refuteNewGroups = waveANotes.length ? [waveANotes.slice(0, half), waveANotes.slice(half)].filter((g) => g.length) : []
const refuteNewThunks = refuteNewGroups.map((group, i) => () => run(`${CTX}

YOUR TASK — ADVERSARIAL VERIFICATION of THIS run's fresh claims. Read ${group.join(' and ')}
(written minutes ago by sibling agents). Extract their 10-14 most load-bearing claims (anything
score-bearing, status-bearing, or recommendation-bearing) and attempt refutation against disk: read the
cited callers/configs, check tags, run a targeted test if cited. Verdict per claim:
CONFIRMED | REFUTED (+correction) | UNVERIFIABLE. Write notes to ${N}/refute-new-${i + 1}.md.`,
  { label: `refute-new-${i + 1}`, phase: 'Verify-New', schema: REFUTER }))

phase('Lenses')
log(`Wave B: ${lensThunks.length} lens agents + ${refuteNewThunks.length} refuters over wave-A fresh claims (parallel)`)
const [lensResults, refuteNewResults] = await parallel([
  () => parallel(lensThunks),
  () => parallel(refuteNewThunks),
])

// Refute the lens notes themselves (the proven fix for the unverified-lens gap).
let refuteLens = null
if (LENSES.length) {
  refuteLens = await run(`${CTX}

YOUR TASK — ADVERSARIAL VERIFICATION of the lens claims. Read ${LENSES.map((s) => `${N}/${s.file}`).join(' and ')}.
Extract the 10-14 most load-bearing claims (every DONE/SUPERSEDED status whose evidence you can re-check;
every "obsolete"/"supersedes" assertion) and attempt refutation against disk. Verdict per claim:
CONFIRMED | REFUTED (+correction) | UNVERIFIABLE.
Write notes to ${N}/refute-lenses.md.`,
    { label: 'refute-lenses', phase: 'Verify-New', schema: REFUTER })
}

// ---------------------------------------------------------------------------
// Critic — completeness + conflicts
// ---------------------------------------------------------------------------
phase('Critic')
const allSoFar = [...waveA, ...(lensResults || []).filter(Boolean), ...(refuteNewResults || []).filter(Boolean), refuteLens]
  .filter((r) => r && !r._failed)
const critic = await run(`${CTX}

YOUR TASK — COMPLETENESS CRITIC for this audit run. The structured returns so far (compact):
${JSON.stringify(allSoFar.map((r) => ({ label: r._label, headline: r.headline, notesFile: r.notesFile, openItems: r.openItems, refuted: (r.claimsChecked || []).filter((c) => c.verdict === 'REFUTED').map((c) => c.claim) })), null, 1)}

Checks to run (report each in checksRun):
1. Every notesFile above exists on disk and is substantial (ls -la ${N}/).
2. Coverage completeness: does each coverage note actually cover its assigned territory?
3. Cross-note conflicts: collect contradictions between notes (scores, statuses, counts) into conflicts[] —
   include any REFUTED verdicts above that the source note has not been reconciled against.
4. Missing modality: name what NO agent covered that the scope note expects.
For each real gap emit gaps[] with a SELF-CONTAINED task prompt a gap-fill agent could execute (incl. which
notes file to write under ${N}/). Be selective: only gaps that would change conclusions; cap at 4.
Write notes to ${N}/critic-report.md.`,
  { label: 'completeness-critic', phase: 'Critic', schema: CRITIC })

// ---------------------------------------------------------------------------
// Gap-fill — budget-gated, one round
// ---------------------------------------------------------------------------
phase('Gap-fill')
let gapFills = []
const gaps = (critic && !critic._failed && critic.gaps) ? critic.gaps.slice(0, 4) : []
const budgetAllows = budget.total ? budget.remaining() > GAP_FLOOR : true
if (gaps.length && budgetAllows) {
  log(`Gap-fill round: ${gaps.length} agents`)
  gapFills = await parallel(gaps.map((g, i) => () => run(`${CTX}

YOUR TASK — GAP-FILL (critic-identified): ${g.gap}

${g.task}

If the task does not name a notes file, write to ${N}/gap-fill-${i + 1}.md.`,
    { label: `gap-fill-${i + 1}`, phase: 'Gap-fill', schema: BASE })))
} else {
  log(gaps.length ? 'Gap-fill skipped: budget guard' : 'Critic found no conclusion-changing gaps')
}

// ---------------------------------------------------------------------------
// Synthesis — draft final doc + results.json + manifest, all written in-workflow
// ---------------------------------------------------------------------------
phase('Synthesis')
const everything = [scout, ...allSoFar, critic, ...gapFills.filter((r) => r && !r._failed)].filter(Boolean)
const synth = await run(`${CTX}

YOUR TASK — SYNTHESIS. You write three files under ${N}/ (these are your ONLY permitted writes):

1. ${N}/results.json — verbatim persistence of the structured returns passed below (pretty-printed).
2. ${N}/${A.name}-DRAFT.md — the final audit draft${A.priorDoc ? ` (successor to ${A.priorDoc}, same general section shape)` : ''}, INCLUDING two required sections: "Contested claims" (every REFUTED/UNVERIFIABLE verdict from the refuter agents, with corrections — adjudicate refuted-vs-source conflicts yourself by checking disk where cheap) and a disposition section for every open item, so no tail can silently drop. Honor the critic's conflicts[] — adjudicate each explicitly. Read the underlying ${N}/*.md notes for detail; the structured returns below are your index. Cite per-claim evidence.${A.synthesisSpec ? `\n   Audit-specific shape: ${A.synthesisSpec}` : ''}
3. ${N}/_run-manifest.md — run provenance: HEAD ${scout.headTag}@${scout.headSha}, date ${scout.runDate},
   agent roster with per-agent delivery status (from the data below), refuter tallies
   (CONFIRMED/REFUTED/UNVERIFIABLE counts), and the critic's checksRun.

STRUCTURED RETURNS (full):
${JSON.stringify(everything, null, 1)}`,
  { label: 'synthesis', phase: 'Synthesis', schema: SYNTH })

const refuters = allSoFar.filter((r) => r.claimsChecked)
const tally = { CONFIRMED: 0, REFUTED: 0, UNVERIFIABLE: 0 }
for (const r of refuters) for (const c of r.claimsChecked || []) tally[c.verdict] = (tally[c.verdict] || 0) + 1
log(`Done. Refuter tally: ${tally.CONFIRMED} confirmed / ${tally.REFUTED} refuted / ${tally.UNVERIFIABLE} unverifiable. Draft: ${synth && synth.draftFile}`)

return {
  head: `${scout.headTag}@${scout.headSha}`,
  delivered: everything.filter((r) => !r._failed).length,
  refuterTally: tally,
  criticConflicts: critic && critic.conflicts,
  gapFills: gapFills.length,
  synthesis: synth,
}
