# cs25-26-sweep integration tests (v1.49.575 Phase 813)

End-to-end integration tests verifying the seven Half B modules
(HB-01..HB-07) compose correctly and that the milestone's static
guarantees hold.

Files:

- `compose-hb04-hb07.test.ts` — keystone HB-04 × HB-07 composition test
  exercising the double-gate semantic (role-split CAPCOM + bandit-engagement
  CAPCOM + protocol-update CAPCOM).
- `flag-off-aggregate-byte-identical.test.ts` — with all 7 flags off, the
  aggregate behavior across orchestration / safety / skill-creator / cartridge
  is byte-identical to a no-cs25-26-sweep-block baseline.
- `safety-harness-coverage.test.ts` — three CS25-10 categories present:
  STD calibration test (HB-03), where/how/what BLOCK schema test (HB-02),
  and MCP six-attack-family tests (deferred, see safety-harness-updates.md).
- `adr-coverage.test.ts` — verifies all 55 ADR files exist and parse with
  required fields (arXiv ID, Module, Reviewer model). This is the static
  guarantee underlying CS25-01 + CS25-02.

These tests are the milestone-close acceptance gate — see
`docs/release-notes/v1.49.575/REGRESSION.md`.
