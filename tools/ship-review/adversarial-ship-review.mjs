export const meta = {
  name: 'adversarial-ship-review',
  description: 'Adversarial pre-push review of the current ship diff: parallel dimension-reviewers -> structured findings -> adversarial verify -> confirmed defects to fix in code before push',
  whenToUse: 'Run at T14 on the ship diff (after the code commit, before `git push origin dev`). Reviewers are read-only; the orchestrator fixes confirmed REAL findings in code, then re-runs the gate.',
  phases: [
    { title: 'Review' },
    { title: 'Verify' },
  ],
}

// ---------------------------------------------------------------------------
// adversarial-ship-review.mjs
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
// before push (it caught real BLOCKERs in v1.49.965 Ship 0.1 and a real MAJOR in
// v1.49.966 Ship 0.2, and a real defect in 11/35 F4 ships). See the canonical
// process doc docs/adversarial-ship-review.md.
//
// ISOLATION DISCIPLINE (load-bearing — feedback_workflow-agents-invalidate-file-read-state):
//   Reviewers run as the read-only `Explore` agent type (no Edit/Write/NotebookEdit
//   in its toolkit), so they CANNOT mutate the source under review. Worktree
//   isolation is deliberately NOT used: a fresh worktree lacks node_modules, so
//   tsx/vitest probes fail there. If a reviewer needs to PROBE runtime behavior it
//   must be additive-only (write a throwaway probe-*.mts in the repo root, never
//   edit the source). The orchestrator MUST `git status` the tree after this
//   workflow and `git checkout`/restore before trusting it (belt-and-suspenders;
//   Explore agents leave zero leaks, but a non-read-only agentType override would).
//
// args (all optional):
//   { base?: string,         // diff base ref; default 'HEAD~1' (the just-made code commit)
//     intent?: string,       // one-paragraph statement of what the ship is supposed to do
//     dimensions?: string[] } // subset of dimension keys to run; default: all five
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
        required: ['severity', 'title', 'detail', 'location'],
        properties: {
          severity: { type: 'string', description: 'BLOCKER | MAJOR | MINOR | INFO' },
          title: { type: 'string' },
          detail: { type: 'string', description: 'what is wrong and why it matters' },
          location: { type: 'string', description: 'file:line or file' },
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
    confidence: { type: 'string', description: 'high | medium | low' },
  },
}

function context() {
  return `You are one reviewer in an ADVERSARIAL PRE-PUSH SHIP REVIEW of a single
gsd-skill-creator ship diff. You are read-only: inspect, do not modify anything.

THE DIFF UNDER REVIEW: \`git diff ${BASE}\` (also useful: \`git diff ${BASE} --stat\`,
\`git log ${BASE}..HEAD --format='%H %s%n%b'\`). You are inside the repo at HEAD.

SHIP INTENT (what this change is supposed to accomplish):
${INTENT}

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
verdict CLEAN or FINDINGS, and a findings[] array (severity/title/detail/location/suggested_fix).`,
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
// Aggregate. The orchestrator reads `confirmed` and fixes each in code before push.
// ---------------------------------------------------------------------------
const confirmed = perDimension.flatMap((d) => (d && d.confirmed) || [])
const rejected = perDimension.flatMap((d) => (d && d.rejected) || [])
const bySeverity = confirmed.reduce((acc, c) => {
  const s = (c.finding.severity || 'UNKNOWN').toUpperCase()
  acc[s] = (acc[s] || 0) + 1
  return acc
}, {})

log(`adversarial-ship-review: ${confirmed.length} confirmed (${JSON.stringify(bySeverity)}), ${rejected.length} refuted`)

return {
  base: BASE,
  dimensionsRun: requested.map((d) => d.key),
  confirmedCount: confirmed.length,
  bySeverity,
  confirmed: confirmed.map((c) => ({ ...c.finding, verifyReason: c.verdict.reason })),
  rejected: rejected.map((c) => ({ title: c.finding.title, location: c.finding.location, refutedBecause: c.verdict.reason })),
}
