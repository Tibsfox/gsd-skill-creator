# Documentation Drift Detection Test Procedures

**Reference:** Requirement VERIF-04, SC-018, CF-SK-022, CF-CH-012
**Status:** Specification
**NASA SE Phase:** Phase D (Integration and Test)

---

## Purpose

This document defines test procedures for verifying that the `doc-verifier` skill correctly
detects documentation drift when drift is intentionally introduced. These are "verify the
verifier" tests -- they confirm that the drift detection mechanism works before it is trusted
to protect the accuracy of the operations documentation.

Documentation drift is the gap between what documentation says and what the running system
does. The `doc-verifier` skill (see `skills/methodology/doc-verifier/SKILL.md`) detects four
categories of drift using NASA's TAID verification methods (SP-6105 SS 5.3). This document
provides structured test scenarios -- one intentional drift introduction per scenario -- that
confirm each detection category functions correctly.

**Failure mode being tested:** A procedure marked "doc-verified" in the operations manual
or runbook library is incorrect but the doc-verifier fails to detect the error. This would
allow operators to follow documentation that does not match the running system, producing
unexpected results and eroding trust in all documentation.

---

## Drift Categories

The `doc-verifier` skill defines four drift categories, each with distinct detection strategies:

| Category | Definition | Primary Detection Method |
|----------|-----------|--------------------------|
| **Configuration drift** | Documented setting `X=A`, running system has `X=B` | Analysis -- read config files, compare to docs |
| **Endpoint drift** | Documented URL/port differs from actual endpoint | Test -- probe actual endpoints, compare to docs |
| **Procedure drift** | Documented steps no longer produce documented results | Test -- execute commands, compare output |
| **Reference drift** | External documentation link no longer valid | Inspection -- resolve links, verify targets |

---

## Test Scenario Format

Each scenario follows this structure:

- **Scenario ID:** `DRIFT-{CATEGORY}-{NNN}` -- unique identifier for cross-referencing
- **Category:** Which of the four drift categories this tests
- **Detection method:** Which TAID method the doc-verifier uses (Test/Analysis/Inspection/Demonstration)
- **Setup:** What the documentation says before drift is introduced
- **Intentional drift introduction:** The exact change that creates the mismatch
- **Expected detection:** What the doc-verifier should report
- **Pass criteria:** The specific output that confirms detection worked
- **Restore action:** How to return documentation to baseline after the test

---

## Test Scenarios

### DRIFT-CONFIG-001: Keystone Token Lifetime Mismatch

**Category:** Configuration drift
**Detection method:** Analysis (doc-verifier reads keystone.conf, compares to documented value)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/operations-manual/keystone/OPS-KEYSTONE-002.md` states:
```
Token lifetime is configured to 3600 seconds (1 hour) for security compliance.
keystone.conf [fernet_tokens]:
  token_expiration = 3600
```
Running system: `keystone.conf` has `token_expiration = 3600`. Documentation matches system.

**Intentional drift introduction:**
Modify the documentation to state `token_expiration = 7200` while leaving the running system
at `token_expiration = 3600`:
```bash
# In OPS-KEYSTONE-002.md, change the documented value:
# Before: token_expiration = 3600
# After:  token_expiration = 7200
```

**Expected detection:**
Doc-verifier analysis phase compares documented `token_expiration = 7200` against actual
`keystone.conf` value `token_expiration = 3600`. Expected report:
```
[CRITICAL] OPS-KEYSTONE-002: Configuration drift detected
  Setting: keystone.conf [fernet_tokens] token_expiration
  Documented: 7200
  Actual:     3600
  Severity: CRITICAL -- security setting; documented value increases token validity beyond
             the configured threshold, masking a potential security misconfiguration.
```

**Pass criteria:**
- Doc-verifier identifies `OPS-KEYSTONE-002` as the affected document
- Reports the specific config key (`token_expiration` in `[fernet_tokens]`)
- Reports correct documented value (7200) and actual value (3600)
- Assigns CRITICAL severity (security configuration)

**Restore action:** Revert `OPS-KEYSTONE-002.md` to `token_expiration = 3600`.

---

### DRIFT-CONFIG-002: Nova Compute Driver Mismatch

**Category:** Configuration drift
**Detection method:** Analysis (doc-verifier reads nova.conf, compares to documented value)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/operations-manual/nova/OPS-NOVA-001.md` states:
```
Nova compute driver: libvirt.LibvirtDriver
nova.conf [DEFAULT]:
  compute_driver = libvirt.LibvirtDriver
```
Running system: `nova.conf` has `compute_driver = libvirt.LibvirtDriver`.

**Intentional drift introduction:**
Modify the documentation to state `compute_driver = fake.FakeDriver` while the system
retains `libvirt.LibvirtDriver`:
```bash
# In OPS-NOVA-001.md, change:
# Before: compute_driver = libvirt.LibvirtDriver
# After:  compute_driver = fake.FakeDriver
```

**Expected detection:**
```
[CRITICAL] OPS-NOVA-001: Configuration drift detected
  Setting: nova.conf [DEFAULT] compute_driver
  Documented: fake.FakeDriver
  Actual:     libvirt.LibvirtDriver
  Severity: CRITICAL -- compute driver mismatch; documented driver does not match
             the running driver; troubleshooting procedures based on documentation
             will not apply to the actual system.
```

**Pass criteria:**
- Correct document identified (`OPS-NOVA-001`)
- Both documented and actual driver values reported accurately
- CRITICAL severity assigned (fundamental service configuration)

**Restore action:** Revert `OPS-NOVA-001.md` to `compute_driver = libvirt.LibvirtDriver`.

---

### DRIFT-ENDPOINT-001: Service Catalog Endpoint URL Change

**Category:** Endpoint drift
**Detection method:** Test (doc-verifier probes actual endpoint, compares to documented URL)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/operations-manual/keystone/OPS-KEYSTONE-001.md` states:
```
Keystone API endpoint (internal): http://10.0.0.10:5000/v3
```
Running system: Keystone listens at `http://10.0.0.10:5000/v3`. Documentation matches.

**Intentional drift introduction:**
Modify the documentation to reference port 5001 while the system uses port 5000:
```bash
# In OPS-KEYSTONE-001.md, change:
# Before: http://10.0.0.10:5000/v3
# After:  http://10.0.0.10:5001/v3
```

**Expected detection:**
Doc-verifier probes both documented endpoint (`10.0.0.10:5001`) and compares to service
catalog entry. Expected report:
```
[CRITICAL] OPS-KEYSTONE-001: Endpoint drift detected
  Documented endpoint: http://10.0.0.10:5001/v3
  Service catalog (actual): http://10.0.0.10:5000/v3
  HTTP probe of documented endpoint: Connection refused (port 5001 not listening)
  Severity: CRITICAL -- documented endpoint unreachable; any operator following
             this procedure will fail at the first API call.
```

**Pass criteria:**
- Doc-verifier identifies the unreachable documented endpoint
- Reports both the documented URL and the actual service catalog URL
- CRITICAL severity (procedure will fail on execution)

**Restore action:** Revert `OPS-KEYSTONE-001.md` to port 5000.

---

### DRIFT-ENDPOINT-002: Horizon Dashboard Port Mismatch

**Category:** Endpoint drift
**Detection method:** Test (HTTP probe of documented port vs. actual listening port)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/operations-manual/horizon/OPS-HORIZON-001.md` states:
```
Horizon dashboard URL: http://10.0.0.10:80
Access via browser at: http://10.0.0.10/
```
Running system: Horizon serves on port 80 (standard HTTP). Documentation matches.

**Intentional drift introduction:**
Modify the documentation to reference port 8080:
```bash
# In OPS-HORIZON-001.md, change:
# Before: http://10.0.0.10:80
# After:  http://10.0.0.10:8080
```

**Expected detection:**
```
[CRITICAL] OPS-HORIZON-001: Endpoint drift detected
  Documented port: 8080
  Actual port: 80
  HTTP probe http://10.0.0.10:8080: Connection refused
  HTTP probe http://10.0.0.10:80: HTTP 200 OK (Horizon login page)
  Severity: CRITICAL -- dashboard inaccessible at documented URL.
```

**Pass criteria:**
- Specific mismatched port identified (8080 vs 80)
- Doc-verifier confirms actual port responds (port 80) while documented does not (port 8080)
- CRITICAL severity assigned

**Restore action:** Revert `OPS-HORIZON-001.md` to port 80.

---

### DRIFT-PROCEDURE-001: Fernet Key Rotation Procedure Produces Different Result

**Category:** Procedure drift
**Detection method:** Test (execute documented commands, compare output structure to documented)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/runbooks/keystone/RB-KEYSTONE-002.md` states:
```
Step 3: Rotate Fernet keys
  $ openstack credential migrate
  Expected: "Migrating credentials to a new key..."
  Output will contain migration completion message.
```
Running system: This command produces the documented output.

**Intentional drift introduction:**
Modify the documented expected output to reference a deprecated message format from an
older OpenStack release:
```bash
# In RB-KEYSTONE-002.md, change Step 3 expected output:
# Before: "Migrating credentials to a new key..."
# After:  "Rotating Fernet keys... (deprecated v2 format)"
```

**Expected detection:**
Doc-verifier runs `openstack credential migrate` in read-only probe mode (or parses output
from a recent execution log), compares actual output to documented expected output:
```
[WARNING] RB-KEYSTONE-002 Step 3: Procedure drift detected
  Command: openstack credential migrate
  Documented expected output: "Rotating Fernet keys... (deprecated v2 format)"
  Actual output: "Migrating credentials to a new key..."
  Severity: WARNING -- procedure will execute correctly but output validation step
             will fail, causing operators to believe the procedure failed when it
             actually succeeded.
```

**Pass criteria:**
- Specific step (Step 3) and runbook (RB-KEYSTONE-002) identified
- Both documented and actual expected outputs reported
- WARNING severity (procedure works, but validation is wrong)

**Restore action:** Revert `RB-KEYSTONE-002.md` expected output to "Migrating credentials to a new key..."

---

### DRIFT-PROCEDURE-002: Nova Instance Creation with Wrong Flavor Name

**Category:** Procedure drift
**Detection method:** Test (verify documented flavor name exists via `openstack flavor list`)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/runbooks/nova/RB-NOVA-003.md` states:
```
Step 1: Create test instance
  $ openstack server create --flavor m1.small --image cirros ...
```
Running system: Flavor `m1.small` exists. Command produces documented result.

**Intentional drift introduction:**
Modify the documented command to reference a non-existent flavor:
```bash
# In RB-NOVA-003.md, change Step 1:
# Before: --flavor m1.small
# After:  --flavor m1.tiny-deprecated
```

**Expected detection:**
Doc-verifier runs `openstack flavor list` and checks whether `m1.tiny-deprecated` appears.
It does not. Expected report:
```
[CRITICAL] RB-NOVA-003 Step 1: Procedure drift detected
  Command references flavor: m1.tiny-deprecated
  Available flavors (openstack flavor list): m1.nano, m1.small, m1.medium, m1.large, m1.xlarge
  Severity: CRITICAL -- procedure will fail; documented flavor does not exist on this system.
```

**Pass criteria:**
- Non-existent flavor name identified
- Available flavors listed for operator guidance
- CRITICAL severity (procedure will fail on execution)

**Restore action:** Revert `RB-NOVA-003.md` to `--flavor m1.small`.

---

### DRIFT-REFERENCE-001: OpenStack Docs URL Version Mismatch

**Category:** Reference drift
**Detection method:** Inspection (verify link resolves; check for version-specific redirect)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/sysadmin-guide/references.md` states:
```
OpenStack Neutron ML2 Plugin Configuration:
https://docs.openstack.org/neutron/2024.1/configuration/ml2-conf.html
```
The URL resolves correctly to the 2024.1 release documentation.

**Intentional drift introduction:**
Modify the reference to point to a release that does not match the deployed version:
```bash
# In docs/sysadmin-guide/references.md, change:
# Before: https://docs.openstack.org/neutron/2024.1/configuration/ml2-conf.html
# After:  https://docs.openstack.org/neutron/queens/configuration/ml2-conf.html
```

**Expected detection:**
Doc-verifier resolves both URLs. The `queens` URL resolves (it exists in the archive) but
does not match the deployed version (2024.1). Expected report:
```
[WARNING] docs/sysadmin-guide/references.md: Reference drift detected
  Reference: OpenStack Neutron ML2 Plugin Configuration
  Documented URL: https://docs.openstack.org/neutron/queens/configuration/ml2-conf.html
  Deployed version: 2024.1
  URL resolves: YES (archive exists for Queens release)
  Version match: NO (Queens != 2024.1)
  Severity: WARNING -- link resolves but references wrong release; configuration
             options and defaults may differ between Queens and 2024.1.
```

**Pass criteria:**
- Version mismatch identified (Queens vs 2024.1)
- Doc-verifier does NOT treat a resolving URL as automatically valid when version mismatches
- WARNING severity (link works, content may be stale)

**Restore action:** Revert reference URL to `2024.1`.

---

### DRIFT-REFERENCE-002: SP-6105 Section Number Cross-Reference Error

**Category:** Reference drift
**Detection method:** Inspection (verify SP-6105 section number matches documented content)
**Requirement verified:** CF-SK-022, SC-018

**Setup (baseline state):**
Documentation in `docs/vv/safety-critical-tests.md` contains:
```
Reference: SP-6105 SS 5.3 (Product Verification)
```
SP-6105 SS 5.3 is indeed the Product Verification section. Reference is correct.

**Intentional drift introduction:**
Modify the reference to cite the wrong section number:
```bash
# In a test copy of the file, change:
# Before: SP-6105 SS 5.3 (Product Verification)
# After:  SP-6105 SS 5.4 (Product Validation)
```
Note: SS 5.4 is Product Validation, not Product Verification. The citation applies the
wrong concept -- validation is confirming the right thing was built; verification is
confirming it was built correctly. These are distinct processes.

**Expected detection:**
Doc-verifier inspection cross-checks NASA SE section numbers against the reference library
mapping (section names derived from NASA SE Handbook):
```
[CRITICAL] docs/vv/safety-critical-tests.md: Reference drift detected
  Cited: SP-6105 SS 5.4 (described in doc as "Product Verification")
  Actual content of SS 5.4: Product Validation (not Verification)
  Product Verification is SP-6105 SS 5.3
  Severity: CRITICAL -- incorrect section citation; readers consulting the reference
             will find Product Validation procedures, not Product Verification.
```

**Pass criteria:**
- Section number/title mismatch identified
- Correct section number for Product Verification provided (SS 5.3)
- CRITICAL severity (incorrect citation misdirects readers)

**Restore action:** Revert reference to `SP-6105 SS 5.3 (Product Verification)`.

---

## Detection Verification Procedure

This five-step procedure applies to all eight test scenarios above. Run the complete
procedure for each scenario to confirm the doc-verifier detection works end-to-end.

### Step 1: Establish Baseline

Run doc-verifier against the target document in its unmodified (known-good) state.

```bash
# Example: verify baseline for OPS-KEYSTONE-002
doc-verifier verify docs/operations-manual/keystone/OPS-KEYSTONE-002.md
```

Expected result: `0 drift items detected. Document verified.`

Proceed only if the baseline passes clean. If the baseline already has drift, resolve it
before running the scenario -- the scenario requires a known-good starting point.

### Step 2: Introduce Intentional Drift

Apply exactly the change specified in the scenario's "Intentional drift introduction" section.
Make only the specified change -- additional changes may interfere with drift detection.

Record:
- The file modified
- The line number(s) changed
- The exact before and after values

### Step 3: Run Detection

Run doc-verifier against the modified document:

```bash
doc-verifier verify [target-document]
```

For scenarios involving system configuration (DRIFT-CONFIG-001, DRIFT-CONFIG-002), run
the analysis mode:

```bash
doc-verifier analyze --config [target-document]
```

For endpoint scenarios (DRIFT-ENDPOINT-001, DRIFT-ENDPOINT-002), run the endpoint probe:

```bash
doc-verifier probe --endpoints [target-document]
```

### Step 4: Validate Detection Report

Confirm the drift report contains all required elements:

- [ ] **Artifact path:** Report identifies the specific file where drift was found
- [ ] **Expected value:** Report states what the documentation says (the drifted value)
- [ ] **Actual value:** Report states what the system or reference says (the correct value)
- [ ] **Severity:** Report assigns appropriate severity (CRITICAL/WARNING/INFO per SKILL.md)
- [ ] **Location:** Report identifies the specific section, step, or configuration key affected

A detection report that identifies "drift exists" without specifying the exact location and
values is insufficient for operators to diagnose and fix the problem.

### Step 5: Restore Documentation to Baseline

Revert the intentional change:

```bash
git diff [target-document]  # Confirm only the intended change is present
git checkout [target-document]  # Restore to last committed (baseline) state
```

Re-run doc-verifier to confirm baseline passes clean after restore:

```bash
doc-verifier verify [target-document]
```

Expected result: `0 drift items detected. Document verified.`

---

## Integration with Doc-Sync Communication Loop

The doc-verifier operates on the **doc-sync communication loop** (Priority 4) within the
GSD communication framework. Understanding this integration is essential for knowing when
drift detection triggers automatically versus when it must be invoked manually.

### Automatic Trigger Path

1. SURGEON (operations crew) detects a system change -- config update, service restart,
   version upgrade -- via the health monitoring loop
2. SURGEON sends a drift alert to the doc-sync loop: `{type: config-change, service: keystone,
   changed_keys: [fernet_tokens.token_expiration]}`
3. Doc-verifier receives the alert and runs targeted verification against documents that
   reference the changed configuration (identified by pattern matching against SKILL.md
   detection patterns: `OPS-KEYSTONE-*` for Keystone changes)
4. Drift findings are reported to FLIGHT via the doc-sync loop
5. FLIGHT directs EXEC (or the documentation crew) to update the affected documentation
6. Updated documentation is re-verified before the `doc-verified` flag is re-set

### Manual Trigger Path

Operators and agents can invoke doc-verifier on demand for:

- **Pre-maintenance check:** Verify all procedures are accurate before starting maintenance
- **Post-upgrade audit:** After an OpenStack service upgrade, verify all procedures still
  produce documented results for the new release
- **Periodic audit:** Scheduled weekly verification to catch drift that accumulates without
  a specific triggering event (e.g., documentation written against a future target that
  was never updated after implementation decisions changed)

### Drift Resolution Paths

| Drift type | Automatic resolution | Manual resolution |
|-----------|---------------------|-------------------|
| Documentation ahead of system | EXEC applies config change to bring system in line | Operator evaluates whether config change is intended |
| System ahead of documentation | EXEC-docs updates documentation to match system | Operator verifies change was intentional before documenting |
| Reference link invalid | EXEC-docs updates link to current URL | Operator manually verifies replacement source quality |
| Version mismatch | EXEC-docs updates version reference | Operator confirms deployed version before updating |

Automatic resolution applies only when the change direction is unambiguous. When the
correct resolution requires human judgment (e.g., determining whether a config change
was intentional), the doc-sync loop routes to CAPCOM for HITL decision.

---

*Document maintained in `docs/vv/`. Updates require re-running all eight drift scenarios.*
*Cross-reference: `skills/methodology/doc-verifier/SKILL.md`, `docs/vv/safety-critical-tests.md` SC-018*
