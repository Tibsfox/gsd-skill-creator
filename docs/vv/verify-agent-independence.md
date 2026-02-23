# VERIFY Agent Independence Specification

**Reference:** Requirement VERIF-03, SC-013, NPR 7123.1 Process 7 (Product Verification)
**Status:** Specification
**NASA SE Phase:** Phase D (Integration and Test)

---

## Purpose

This document specifies how the VERIFY agent's independence from the EXEC agent is architecturally
enforced across the GSD OpenStack deployment and operations crews. Independence is not a policy
declaration -- it is a structural property of the crew configuration. This document provides
the proof of that structure, the test procedure for SC-013, and the audit checklist for
confirming VERIFY independence in any crew configuration.

The requirement originates from SP-6105 SS 5.3 (Product Verification) and NPR 7123.1 Process 7,
which require objectivity in the verification function. For this project, per the tailoring
decision documented in the Compliance Matrix, formal Independent V&V (IV&V) is replaced by
architecturally enforced agent independence. This document is the evidence that the architectural
enforcement is sound.

---

## Independence Architecture

### VERIFY Role Definition -- Deployment Crew

From `configs/crews/deployment-crew.yaml`:

```yaml
- id: verify
  role: VERIFY
  context: fork
  lifecycle: task
  tier: 2
  communication_loop: execution
  description: "Runs service health checks, API validation, integration tests.
    Independent from EXEC -- cannot access EXEC implementation context."
  skills:
    - doc-verifier
  skillRequirements:
    required:
      - doc-verifier
    recommended:
      - verification-gates
      - quality-assessment
```

**Key independence properties:**

1. `skills: [doc-verifier]` -- VERIFY carries only the `doc-verifier` skill. It does NOT carry
   any of the OpenStack deployment skills held by EXEC agents (`openstack-keystone`,
   `openstack-nova`, `openstack-neutron`, `openstack-cinder`, `openstack-kolla-ansible`).
   VERIFY has no knowledge of how services are built, only how to verify that they work.

2. `context: fork` -- VERIFY is instantiated in a forked context. It does not share the main
   conversation context with EXEC. Each VERIFY invocation begins with its skill loadout only.

3. `lifecycle: task` -- VERIFY is spawned per task. It receives the task's artifact inputs, not
   the history of decisions that produced those artifacts.

### VERIFY Role Definition -- Operations Crew

From `configs/crews/operations-crew.yaml`:

```yaml
- id: verify
  role: VERIFY
  context: fork
  lifecycle: task
  tier: 2
  communication_loop: execution
  description: "Validates operations against runbook procedures -- independent from EXEC"
  skills:
    - doc-verifier
```

The same pattern applies in the operations crew. VERIFY carries `doc-verifier` only. The
operations EXEC carries `openstack-kolla-ansible` and `openstack-kolla-ansible-ops`. These skill
sets are disjoint.

### Skill Loadout Separation Matrix

| Role | Skills | Can access implementation details? |
|------|--------|-----------------------------------|
| exec-keystone | openstack-keystone, openstack-kolla-ansible | YES -- knows how Keystone is deployed |
| exec-compute | openstack-nova, openstack-glance, openstack-kolla-ansible | YES -- knows how Nova/Glance are deployed |
| exec-network-storage | openstack-neutron, openstack-cinder, openstack-kolla-ansible | YES -- knows how Neutron/Cinder are deployed |
| verify | doc-verifier | NO -- knows how to verify, not how things were built |
| exec (ops) | openstack-kolla-ansible, openstack-kolla-ansible-ops | YES -- knows how to maintain services |

The skill loadout separation is the mechanism that makes independence structural rather than
procedural. Even if a VERIFY agent were instructed to "check how Keystone was configured
internally," it lacks the skill context to interpret that information.

---

## Information Barriers

### What VERIFY CAN Access

VERIFY operates on outputs (artifacts), never on inputs (implementation context):

- **Produced artifacts:** Deployed service configuration files, API endpoints, YAML outputs,
  deployment logs after completion
- **Public API endpoints:** All OpenStack API endpoints accessible to any authenticated
  caller -- same access any operator would have
- **Test results:** Results of verification commands run against the running system
- **Deployment outputs:** Kolla-Ansible deployment completion reports, service health check
  outputs, integration test results
- **Documentation:** Operations manual procedures, runbooks -- the external-facing description
  of system behavior

### What VERIFY CANNOT Access

- **EXEC implementation decisions:** The reasoning EXEC used when selecting configuration
  values, the alternatives EXEC considered but rejected, EXEC's internal interpretation
  of PLAN's specifications
- **EXEC's internal reasoning:** Because VERIFY is forked into a separate context, EXEC's
  context window is not visible to VERIFY
- **Draft configurations:** Intermediate configurations before EXEC finalizes them. VERIFY
  receives finalized artifacts only
- **PLAN's decomposition strategy:** VERIFY does not see how PLAN divided the deployment
  into tasks. VERIFY receives a completed artifact and verification criteria only
- **Crew conversation history:** VERIFY's forked context starts from its skill loadout,
  not from the accumulated conversation between FLIGHT, PLAN, EXEC, and INTEG

### Enforcement Mechanism

The information barrier is enforced by the crew configuration's fork architecture:

```
Communication loop: execution

PLAN → [produces spec]
EXEC → [builds from spec, produces artifact]
VERIFY → [receives artifact via execution loop, not EXEC's context]
```

VERIFY receives only what the execution loop delivers: the artifact and the verification
criteria from PLAN. EXEC's implementation context is not part of the execution loop payload.
INTEG may also forward integration status to VERIFY, but this is post-implementation
status, not implementation detail.

---

## Test Procedure for SC-013

**SC-013: VERIFY agent independent from EXEC**

This is the mandatory safety-critical test verifying VERIFY independence. It feeds directly
from this specification.

### Preconditions

- `configs/crews/deployment-crew.yaml` exists and is syntactically valid YAML
- `configs/crews/operations-crew.yaml` exists and is syntactically valid YAML

### Procedure

**Step 1: Verify VERIFY skill loadout in deployment crew**
```bash
grep -A 15 "id: verify" configs/crews/deployment-crew.yaml | grep -E "skills:|  - "
```
Expected output:
```
    skills:
      - doc-verifier
```
Pass: Output contains exactly `doc-verifier` and no OpenStack deployment skills.
Fail: Any OpenStack skill (`openstack-keystone`, `openstack-nova`, `openstack-neutron`,
`openstack-cinder`, `openstack-kolla-ansible`) appears in the VERIFY skills block.

**Step 2: Confirm EXEC agents do NOT carry doc-verifier**
```bash
grep -A 20 "id: exec-keystone" configs/crews/deployment-crew.yaml | grep "doc-verifier"
grep -A 20 "id: exec-compute" configs/crews/deployment-crew.yaml | grep "doc-verifier"
grep -A 20 "id: exec-network-storage" configs/crews/deployment-crew.yaml | grep "doc-verifier"
```
Expected output: No output (none of the EXEC agents carry doc-verifier).
Pass: All three commands produce empty output.
Fail: Any EXEC agent's skill block contains `doc-verifier`.

**Step 3: Verify VERIFY skill loadout in operations crew**
```bash
grep -A 10 "id: verify" configs/crews/operations-crew.yaml | grep -E "skills:|  - "
```
Expected output:
```
    skills:
      - doc-verifier
```
Pass: Output contains exactly `doc-verifier`.

**Step 4: Confirm operations EXEC does NOT carry doc-verifier**
```bash
grep -A 20 "id: exec" configs/crews/operations-crew.yaml | grep "doc-verifier"
```
Expected output: No output.

**Step 5: Verify VERIFY uses forked context**
```bash
grep -A 5 "id: verify" configs/crews/deployment-crew.yaml | grep "context:"
grep -A 5 "id: verify" configs/crews/operations-crew.yaml | grep "context:"
```
Expected output (both): `    context: fork`
Pass: Both VERIFY definitions specify `context: fork`.
Fail: Either VERIFY uses `context: main`, which would allow shared context with EXEC.

### Pass Criteria for SC-013

All five steps pass when:

1. VERIFY's skills list in deployment-crew.yaml contains `doc-verifier` and only `doc-verifier`
2. No EXEC agent in deployment-crew.yaml carries `doc-verifier`
3. VERIFY's skills list in operations-crew.yaml contains `doc-verifier` and only `doc-verifier`
4. Operations EXEC does not carry `doc-verifier`
5. Both VERIFY definitions specify `context: fork`

**Fail Action:** BLOCK -- If VERIFY carries any EXEC skill, or if any EXEC carries `doc-verifier`,
the independence requirement is violated. Correct the crew configuration before proceeding.

---

## Independence Audit Checklist

This 5-point checklist can be run against any crew configuration to verify VERIFY independence.
Use this before deploying any new crew or modifying an existing crew configuration.

**Checklist for crew: `[crew-name].yaml`**

- [ ] **1. Skill disjointness:** VERIFY's `skills` list and all EXEC roles' `skills` lists
  share no common entries. No skill appears in both VERIFY and any EXEC.

- [ ] **2. Forked context:** VERIFY uses `context: fork`, not `context: main`. A `main`
  context VERIFY could access shared conversation state.

- [ ] **3. Task lifecycle:** VERIFY uses `lifecycle: task`. It is not `persistent`, which
  would accumulate context across tasks and potentially absorb EXEC's reasoning.

- [ ] **4. Execution loop only:** VERIFY's `communication_loop` is `execution`. It does not
  participate in the `command` loop (which carries FLIGHT-to-EXEC directives) or the
  `specialist` loop (which carries CRAFT's implementation knowledge).

- [ ] **5. No EXEC triggers:** VERIFY has no `triggers` array, and no trigger keywords from
  EXEC's domain (deployment commands, service names, configuration keywords) route to VERIFY.
  VERIFY is activated by the execution loop, not by content-based routing.

A crew configuration passes the independence audit when all 5 items are checked.

---

## NASA Systems Engineering Alignment

### SP-6105 SS 5.3 -- Verification Objectivity

SP-6105 (NASA Systems Engineering Handbook) Section 5.3 states that product verification must
be conducted with objectivity -- the entity performing verification should not be the same
entity that produced the artifact under test. This principle exists to prevent confirmation
bias, where implementers unconsciously interpret ambiguous evidence in favor of their
implementation.

The agent architecture enforces objectivity through skill separation: VERIFY cannot interpret
EXEC's implementation context because it lacks the domain skills to do so. VERIFY's only
analytical framework is the `doc-verifier` skill, which provides procedures for comparing
artifacts against specifications -- not for understanding how artifacts were produced.

### NPR 7123.1 Process 7 -- Product Verification

NPR 7123.1 Process 7 (Product Verification) requires that verification activities be planned
and documented before implementation begins. In this crew architecture, PLAN produces both the
deployment specification (consumed by EXEC) and the verification criteria (consumed by VERIFY).
VERIFY never receives PLAN's rationale for the specification -- only the pass/fail criteria.
This ensures VERIFY cannot unconsciously align its assessment with PLAN's intentions.

### Tailoring Note -- Scaled IV&V

Per the Compliance Matrix and SP-6105 SS 3.11 tailoring provisions: formal Independent V&V
(IV&V) requires a separate organizational entity with no programmatic reporting relationship
to the development team. For a lab-scale project, this level of organizational separation
is disproportionate to the risk level. The crew architecture provides the substantive
benefit of IV&V -- an independent evaluator with no access to implementation context --
through the skill separation mechanism described in this document.

This tailoring is appropriate because:
- The project is classified as Type C-D (small, non-life-critical) per SP-6105 Table 3.11-1
- VERIFY's skill separation is technically verifiable (Steps 1-5 above)
- The independence property is enforced by configuration, not by policy
- Any violation of independence is detectable by SC-013 before deployment

All tailoring decisions are documented in the project Compliance Matrix.

---

*Document maintained in `docs/vv/`. Updates require re-running SC-013 verification.*
*Cross-reference: `docs/vv/safety-critical-tests.md` SC-013, `configs/crews/deployment-crew.yaml`*
