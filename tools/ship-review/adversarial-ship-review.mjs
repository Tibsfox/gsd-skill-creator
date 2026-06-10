export const meta = {
  name: 'adversarial-ship-review',
  description: 'Adversarial pre-push review of the current ship diff: parallel dimension-reviewers -> structured findings -> adversarial verify -> cross-lens synthesis judge -> fix-now list to fix in code before push',
  whenToUse: 'Run at T14 step P on the ship diff (after the code commit, before `git push origin dev`). Reviewers are read-only; the orchestrator fixes every fixNow finding in code, then re-runs the gate.',
  phases: [
    { title: 'Review' },
    { title: 'Verify' },
    { title: 'Judge' },
  ],
}

// ---------------------------------------------------------------------------
// adversarial-ship-review.mjs (v2 — v1.49.1029 Ship 3)
//
// A WORKFLOW-RUNTIME SCRIPT (not a standalone Node CLI). It is executed by the
// Claude Code Workflow tool — `Workflow({ scriptPath:
// 'tools/ship-review/adversarial-ship-review.mjs', args: {...} })` — and uses the
// Workflow globals (agent / parallel / pipeline / phase / log / args). It is NOT
// imported, typechecked (tsconfig covers src/ only), or unit-tested as a CLI; its
// drift-guard is tests/integration/adversarial-ship-review-discipline.test.ts,
// which pins this file's structural contract.
//
// This codifies the ad-hoc "adversarial Workflow review" that recent ships used
// before push (it caught real BLOCKERs in v1.49.965 Ship 0.1, a real MAJOR in
// v1.49.966 Ship 0.2, a real defect in 11/35 F4 ships, and a BLOCKER + MAJORs in
// v1027/v1028). See the canonical process doc docs/adversarial-ship-review.md.
//
// v2 folds in the judge IP proven across the 11 untracked NASA 4-auditor review
// clones (AUDIT-2026-06-09 §4b): a CROSS-LENS SYNTHESIS JUDGE that dedupes
// findings across lenses, independently RE-READS every cited location
// (anti-hallucination — never trusts a reviewer's quote), applies an exception
// allow-list of known-correct steady states, and classifies each surviving
// finding with a 3-way verdict enum (real-fix-now | real-minor-optional |
// rejected-false-positive) instead of a flat boolean.
//
// ISOLATION DISCIPLINE (load-bearing — feedback_workflow-agents-invalidate-file-read-state):
//   Reviewers AND the judge run as the read-only `Explore` agent type (no
//   Edit/Write/NotebookEdit in its toolkit), so they CANNOT mutate the source
//   under review. Worktree isolation is deliberately NOT used: a fresh worktree
//   lacks node_modules, so tsx/vitest probes fail there. If a reviewer needs to
//   PROBE runtime behavior it must be additive-only (write a throwaway
//   probe-*.mts in the repo root, never edit the source). The orchestrator MUST
//   `git status` the tree after this workflow and `git checkout`/restore before
//   trusting it (belt-and-suspenders; Explore agents leave zero leaks, but a
//   non-read-only agentType override would).
//
// args (all optional):
//   { base?: string,          // diff base ref; default 'HEAD~1' (the just-made code commit)
//     intent?: string,        // one-paragraph statement of what the ship is supposed to do
//     dimensions?: string[],  // subset of dimension keys to run; default: all five
//     exceptions?: string[] } // ship-specific known-correct steady states, appended to
//                             // STANDING_EXCEPTIONS and injected into every prompt
// ---------------------------------------------------------------------------

// The Workflow runtime may deliver `args` either as an object OR — depending on the
// invocation path — as a JSON STRING (empirically, scriptPath invocations receive the
// JSON-stringified form). Coerce both to a plain object so base/intent/dimensions are
// honored regardless of how the caller passed them; fall back to {} (defaults) on any
// malformed input so the workflow still runs against HEAD~1.
let A = {}
if (args && typeof args === 'object') A = args
else if (typeof args === 'string' && args.trim()) {
  try { A = JSON.parse(args) } catch { A = {} }
}
const BASE = A.base || 'HEAD~1'
const INTENT = A.intent || '(no ship-intent provided — infer it from the commit message and diff)'

// Exception allow-list (NASA judge IP): KNOWN-CORRECT STEADY STATES of this repo
// that look like defects to a fresh reviewer but are by-design. Stated positively
// (what IS correct), never as forbidden-token enumerations. Ship-specific entries
// arrive via args.exceptions. A finding that merely restates one of these is a
// false positive; the judge rejects it.
const STANDING_EXCEPTIONS = [
  'Gate step 12 STORY-drift printing a WARN pre-bump is the designed steady state (INV-1); it self-resolves at T14 step 2.5 and is not a defect to fix.',
  '`node project-claude/install.cjs --dry-run` exiting 1 with 2 warnings is the documented steady state of the installed tree.',
  'The installed-tree differs for .claude/agents/gsd-executor.md and .claude/agents/gsd-planner.md are the two intentional marker-block agents (installed-newer by design; never deployed over).',
]
const EXCEPTIONS = STANDING_EXCEPTIONS.concat(
  Array.isArray(A.exceptions) ? A.exceptions.filter((e) => typeof e === 'string' && e.trim()) : [],
)

// The five review lenses. Each is blind to the others; diversity catches failure
// modes redundancy can't (perspective-diverse verify, Workflow quality patterns).
const ALL_DIMENSIONS = [
  {
    key: 'correctness',
    label: 'review:correctness',
    focus: `CORRECTNESS & BUGS. Logic errors, off-by-one, wrong conditionals, unhandled
edge cases, broken behavior, regressions, incorrect data flow. For any new code path,
ask what input breaks it. For a changed function, ask what caller now misbehaves.`,
  },
  {
    key: 'scope',
    label: 'review:scope-convention',
    focus: `SCOPE & CONVENTION COMPLIANCE. Does the diff stay within its stated intent
(no unrelated drift swept in)? Conventional-commit format. No Co-Authored-By: Claude
trailer (v1.49.621 HARD-BLOCK). No protected-path staging (.planning/ .claude/ .archive/
artifacts/) without justification. File placement matches project conventions. No stray
debug code, no commented-out blocks, no TODO/UNKNOWN placeholders shipped.`,
  },
  {
    key: 'guard-soundness',
    label: 'review:guard-soundness',
    focus: `TEST & DRIFT-GUARD SOUNDNESS. For every new/changed test or gate: does it pin
the RIGHT thing? Is it mutation-proof (would it actually fail if the code regressed), or
vacuously true? Are regexes/parsers whitespace-fragile or shape-fragile (this lens caught
the v1.49.966 'exit (\\d+)' MAJOR)? Does an "at-least-1" assertion hide a silent fidelity
reduction where exact-N is required? Are there negative-test fixtures where the discipline
demands them?`,
  },
  {
    key: 'doc-accuracy',
    label: 'review:doc-accuracy',
    focus: `DOC & RELEASE-NOTE ACCURACY. Cross-check every factual claim in the diff's
docs / release notes / comments AGAINST the actual code and repo state. Version numbers,
counts ("N tests", "13 -> 0"), file paths, dates, predecessor refs, engine-state numbers
(NASA degree / counter-cadence / manifest). Flag any claim the source does not support.
Flag self-referential leak-scan traps (#10462): a doc must describe a guarded literal,
never quote it.`,
  },
  {
    key: 'security',
    label: 'review:security',
    focus: `SECURITY, LEAK & SELF-MOD. Hardcoded secrets or credentials. Leak-scan
pattern literals embedded in published prose. New disk-read / network-egress /
child-process spawn sites that bypass the LoaderContext/EgressContext/ProcessContext
chokepoints. Self-mod-guard or git-add-blocker regressions. Anything that would publish
private/operator-machine-specific values outward.`,
  },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'verdict', 'findings'],
  properties: {
    dimension: { type: 'string' },
    verdict: { type: 'string', description: 'CLEAN | FINDINGS' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'title', 'detail', 'location', 'confidence'],
        properties: {
          severity: { type: 'string', enum: ['BLOCKER', 'MAJOR', 'MINOR', 'INFO'] },
          title: { type: 'string' },
          detail: { type: 'string', description: 'what is wrong and why it matters' },
          location: { type: 'string', description: 'file:line or file' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          suggested_fix: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['real', 'reason'],
  properties: {
    real: { type: 'boolean', description: 'true = a genuine defect that MUST be fixed before push; false = refuted / not real' },
    reason: { type: 'string', description: 'the evidence that confirms or refutes the finding' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
}

// 3-way verdict enum (NASA judge IP): real-fix-now = genuine, fix in code before
// push; real-minor-optional = genuine but MINOR, operator discretion; rejected-
// false-positive = not a defect (the judge explains why in `problem`).
const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'classified'],
  properties: {
    summary: { type: 'string' },
    classified: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'title', 'location', 'problem', 'verdict'],
        properties: {
          severity: { type: 'string', enum: ['BLOCKER', 'MAJOR', 'MINOR'] },
          title: { type: 'string' },
          location: { type: 'string' },
          problem: { type: 'string', description: 'what is wrong (or, for a rejection, why it is a false positive)' },
          suggested_fix: { type: 'string' },
          mergedFrom: { type: 'array', items: { type: 'string' }, description: 'lens keys this entry dedupes across' },
          verdict: { type: 'string', enum: ['real-fix-now', 'real-minor-optional', 'rejected-false-positive'] },
        },
      },
    },
  },
}

function exceptionsBlock() {
  return `KNOWN-CORRECT STEADY STATES (an observation that merely restates one of these is
NOT a finding — treat it as already explained):
${EXCEPTIONS.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`
}

function context() {
  return `You are one reviewer in an ADVERSARIAL PRE-PUSH SHIP REVIEW of a single
gsd-skill-creator ship diff. You are read-only: inspect, do not modify anything.

THE DIFF UNDER REVIEW: \`git diff ${BASE}\` (also useful: \`git diff ${BASE} --stat\`,
\`git log ${BASE}..HEAD --format='%H %s%n%b'\`). You are inside the repo at HEAD.

SHIP INTENT (what this change is supposed to accomplish):
${INTENT}

${exceptionsBlock()}

HARD RULES:
- READ-ONLY. Use Read / Grep / Glob and read-only Bash (git diff/log/show, grep, cat, ls,
  wc, find, and read-only test runs). Do NOT edit, write, or stage any repo file. If you
  must probe runtime behavior, write a throwaway probe-*.mts in the repo root ONLY and
  describe it; never edit the source under review.
- Every finding cites a concrete location (file:line) and the evidence. No vague worries.
- Default to skepticism about your OWN findings: only raise BLOCKER/MAJOR when the source
  actually supports the claim. Prefer precision over volume.
- If your lens finds nothing real, return verdict CLEAN with an empty findings array —
  a clean lens is a valid and valuable result.`
}

// ---------------------------------------------------------------------------
// Phase 1 (Review) -> Phase 2 (Verify), pipelined per dimension so each lens's
// findings get adversarially verified as soon as that lens returns (no barrier).
// ---------------------------------------------------------------------------
const requested = Array.isArray(A.dimensions) && A.dimensions.length
  ? ALL_DIMENSIONS.filter((d) => A.dimensions.includes(d.key))
  : ALL_DIMENSIONS

log(`adversarial-ship-review: ${requested.length} lens(es) on \`git diff ${BASE}\``)

const perDimension = await pipeline(
  requested,
  // Stage 1 — review through one lens.
  (dim) =>
    agent(
      `${context()}

YOUR LENS — ${dim.focus}

Review the diff strictly through THIS lens. Return the FINDINGS schema: dimension="${dim.key}",
verdict CLEAN or FINDINGS, and a findings[] array (severity/title/detail/location/confidence/suggested_fix).`,
      { label: dim.label, phase: 'Review', schema: FINDINGS_SCHEMA, agentType: 'Explore' },
    ),
  // Stage 2 — adversarially verify each non-INFO finding from this lens.
  (review, dim) => {
    if (!review || !Array.isArray(review.findings)) return { dimension: dim.key, confirmed: [], rejected: [] }
    const toCheck = review.findings.filter((f) => f && f.severity && f.severity.toUpperCase() !== 'INFO')
    if (!toCheck.length) return { dimension: dim.key, confirmed: [], rejected: [], info: review.findings }
    return parallel(
      toCheck.map((f) => () =>
        agent(
          `${context()}

A reviewer raised this finding on the diff. Your job is to REFUTE it. Default to real=false
unless the source clearly confirms the defect. Read the cited location and surrounding code.

  severity: ${f.severity}
  title:    ${f.title}
  location: ${f.location}
  detail:   ${f.detail}

Return the VERDICT schema: real=true ONLY if this is a genuine defect that must be fixed
before push; real=false if it is refuted, already-handled, out-of-scope-by-design, or not
supported by the source. Give the evidence either way.`,
          { label: `verify:${dim.key}`, phase: 'Verify', schema: VERDICT_SCHEMA, agentType: 'Explore' },
        ).then((v) => ({ finding: f, verdict: v })),
      ),
    ).then((checked) => {
      const confirmed = checked.filter((c) => c && c.verdict && c.verdict.real)
      const rejected = checked.filter((c) => c && c.verdict && !c.verdict.real)
      return { dimension: dim.key, confirmed, rejected }
    })
  },
)

// ---------------------------------------------------------------------------
// Aggregate the per-finding refuter results.
// ---------------------------------------------------------------------------
const confirmed = perDimension.flatMap((d) => (d && d.confirmed) || [])
const rejected = perDimension.flatMap((d) => (d && d.rejected) || [])
const bySeverity = confirmed.reduce((acc, c) => {
  const s = (c.finding.severity || 'UNKNOWN').toUpperCase()
  acc[s] = (acc[s] || 0) + 1
  return acc
}, {})

log(`adversarial-ship-review: ${confirmed.length} confirmed (${JSON.stringify(bySeverity)}), ${rejected.length} refuted`)

// ---------------------------------------------------------------------------
// Phase 3 (Judge) — cross-lens synthesis (NASA judge IP, AUDIT-2026-06-09 §4b).
// One judge sees ALL confirmed findings together: dedupes across lenses,
// independently re-reads every cited location, applies the exception allow-list,
// and classifies each survivor with the 3-way verdict. The judge may downgrade
// or reject a confirmed finding (with evidence) but may NOT resurrect a
// refuter-rejected one — rejected findings are provided as context only.
// ---------------------------------------------------------------------------
let judge = null
if (confirmed.length > 0) {
  phase('Judge')
  judge = await agent(
    `${context()}

You are the CROSS-LENS SYNTHESIS JUDGE of this review. ${requested.length} independent
lens reviewers ran; every non-INFO finding was then adversarially verified by a skeptic.
The findings below SURVIVED refutation. Your duties:

1. RE-READ: for EACH finding, open the cited file/location yourself and confirm the claim
   is really present as described — never trust the reviewer's quote or the refuter's
   paraphrase (they can both hallucinate line numbers and content).
2. DEDUPE: merge findings that describe the same underlying defect across lenses into ONE
   entry (record the merged lens keys in mergedFrom).
3. EXCEPTIONS: a finding that merely restates a KNOWN-CORRECT STEADY STATE from the list
   above is a false positive — reject it and name the exception.
4. CLASSIFY each surviving entry with the 3-way verdict:
   - "real-fix-now": a genuine BLOCKER/MAJOR defect that must be fixed in code before push.
   - "real-minor-optional": genuine but MINOR; fixing is operator discretion.
   - "rejected-false-positive": not a defect on re-read (explain why in problem).
   Reject false positives aggressively, but every rejection needs the evidence from your
   own re-read. You may downgrade severity with evidence. You may NOT resurrect any
   finding from the refuter-rejected list below — it is context only.
5. Be specific enough that the orchestrator can apply each fix in one edit (file + exact
   change in suggested_fix).

CONFIRMED FINDINGS (survived per-finding refutation; verifyReason = the refuter's evidence):
${JSON.stringify(confirmed.map((c) => ({ ...c.finding, dimension: undefined, verifyReason: c.verdict.reason })), null, 2)}

REFUTER-REJECTED (context only — do not resurrect):
${JSON.stringify(rejected.map((c) => ({ title: c.finding.title, location: c.finding.location, refutedBecause: c.verdict.reason })), null, 2)}`,
    { label: 'judge:synthesis', phase: 'Judge', schema: JUDGE_SCHEMA, agentType: 'Explore' },
  )
} else {
  log('adversarial-ship-review: 0 confirmed findings — judge skipped (clean review)')
}

// Fail-safe mapping: if the judge ran and returned a classification, fixNow/optional
// come from the 3-way verdicts. If the judge died (null) while confirmed findings
// exist, fall back to treating EVERY confirmed finding as fix-now — a judge failure
// must never silently drop a confirmed defect.
const classified = judge && Array.isArray(judge.classified) ? judge.classified : null
const fixNow = classified
  ? classified.filter((c) => c.verdict === 'real-fix-now')
  : confirmed.map((c) => ({ ...c.finding, verifyReason: c.verdict.reason, verdict: 'real-fix-now' }))
const optional = classified ? classified.filter((c) => c.verdict === 'real-minor-optional') : []
const judgeRejected = classified ? classified.filter((c) => c.verdict === 'rejected-false-positive') : []

log(`adversarial-ship-review: judge → ${fixNow.length} fix-now, ${optional.length} optional, ${judgeRejected.length} judge-rejected${classified ? '' : confirmed.length ? ' (JUDGE UNAVAILABLE — fail-safe: all confirmed treated as fix-now)' : ''}`)

return {
  base: BASE,
  dimensionsRun: requested.map((d) => d.key),
  confirmedCount: confirmed.length,
  bySeverity,
  // v2 contract: fix everything in fixNow before push; optional is operator judgment.
  fixNow,
  optional,
  judgeRejected,
  judgeSummary: judge ? judge.summary : null,
  // v1-compatible surfaces (raw refuter-stage outputs).
  confirmed: confirmed.map((c) => ({ ...c.finding, verifyReason: c.verdict.reason })),
  rejected: rejected.map((c) => ({ title: c.finding.title, location: c.finding.location, refutedBecause: c.verdict.reason })),
}
