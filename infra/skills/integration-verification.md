---
name: integration-verification
description: "Verifies the complete PXE-to-playing infrastructure pipeline end-to-end with stage-based testing, RCON health checks, and performance validation. Use when running integration tests, verifying deployments, or validating the full pipeline."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "integration.*test"
          - "verify.*pipeline"
          - "end.to.end"
          - "pipeline.*check"
          - "deployment.*verify"
        files:
          - "infra/scripts/verify-pipeline.sh"
          - "infra/docs/integration-verification.md"
        contexts:
          - "integration testing"
          - "deployment verification"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "02-minecraft-server"
      phase_origin: "177"
---

# Integration Verification

## Purpose

Verifies the complete infrastructure pipeline from PXE boot through to a playable Minecraft server. Runs stage-based tests across all seven deployment stages (PXE, kickstart, VM, Minecraft, mods, config, Syncmatica) with both dry-run and live modes. Provides RCON-based health checks with three-tier fallback and performance metrics (TPS, memory, timing).

## Capabilities

- Stage-based verification across 7 pipeline stages: PXE, kickstart, VM, Minecraft, mods, config, Syncmatica
- Dry-run mode for offline testing without live infrastructure
- Live mode with RCON three-tier fallback (mcrcon, python3 socket, /dev/tcp)
- INFRA_DIR environment variable override for test mocking without script modification
- Performance metrics collection: TPS, memory usage, stage timing
- Hardware capabilities validation using discover-all.sh output patterns
- Pass/fail/skip status per stage with aggregate result
- Structured output suitable for CI/CD pipeline integration

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/verify-pipeline.sh` | Main end-to-end pipeline verification with 7 test stages |

## Dependencies

- All upstream infrastructure deployed (PXE, kickstart, VM, Minecraft, mods, config)
- `mcrcon` or python3 for RCON health checks (fallback to /dev/tcp)
- Hardware profile from discover-all.sh output
- INFRA_DIR pointing to infra/ directory (or override for testing)

## Usage Examples

**Dry-run verification (no live infrastructure needed):**
```bash
infra/scripts/verify-pipeline.sh --dry-run
# Tests template rendering, config validation, script syntax
```

**Full live pipeline verification:**
```bash
infra/scripts/verify-pipeline.sh
# Tests all 7 stages against live infrastructure
```

**Verify specific stage only:**
```bash
infra/scripts/verify-pipeline.sh --stage minecraft
# Tests only the Minecraft server stage
```

**Mock infrastructure for testing:**
```bash
INFRA_DIR=/tmp/test-infra infra/scripts/verify-pipeline.sh --dry-run
# Uses mock infrastructure directory
```

## Test Cases

### Test 1: Dry-run all stages pass
- **Input:** Run `verify-pipeline.sh --dry-run` with valid infrastructure files
- **Expected:** All 7 stages report PASS status
- **Verify:** `infra/scripts/verify-pipeline.sh --dry-run 2>&1 | grep -c 'PASS'` returns 7

### Test 2: INFRA_DIR override works
- **Input:** Set `INFRA_DIR=/tmp/mock` and run with mock files
- **Expected:** Script uses mock directory instead of default infra/
- **Verify:** No references to real infra/ in output when INFRA_DIR is set

### Test 3: RCON fallback chain
- **Input:** Run live verification without mcrcon installed
- **Expected:** Falls back to python3 socket, then /dev/tcp
- **Verify:** Output shows which RCON method was used (logged at info level)

## Token Budget Rationale

1.5% budget covers verify-pipeline.sh (~300 lines) which integrates with all other infrastructure skills. Despite being a single script, it exercises the entire pipeline and contains stage-specific verification logic for 7 different subsystems, justifying a moderate budget.
