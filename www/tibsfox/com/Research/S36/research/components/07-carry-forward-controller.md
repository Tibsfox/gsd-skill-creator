
## Implementation Steps

1. Verify `safetySignal.signal === 'PASS'`; else halt
2. Create staging dir: `releases/seattle-360/.staging/NNN-[slug]/`
3. Copy Wave 2 outputs to staging
4. Verify all 4 files: `pdf`, `tex`, `html`, `json`
5. Rename staging → final path (atomic)
6. `chmod 444 releases/seattle-360/NNN-[slug]/*`
7. Update `progress.json`: set degree N → COMPLETE
8. Append to `release-ledger.md`
9. Merge `knowledge-nodes.json` into `college-node-index.json`
10. Release `.lock` file

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| RP-01 | PASS signal + 4 valid files | All files in `000-quincy-jones/` | Path exists, 4 files |
| RP-02 | Simulated write failure during staging | No files in final path | Staging cleaned up |
| RP-03 | BLOCK signal from Safety Warden | No files written | halt + log only |
| RP-04 | progress.json after publish | degree=0 → COMPLETE | Status field correct |
| RP-05 | release-ledger.md after 3 releases | 3 entries, sequential degrees | Ledger has 3 lines |

## Verification Gate
- [ ] RP-01 through RP-05 pass
- [ ] `chmod 444` verified on published files
- [ ] Progress.json is valid JSON after update
- [ ] No `.staging/` directories left behind

## Safety Boundaries
| Constraint | Boundary Type |
|-----------|---------------|
| BLOCK signal must halt pipeline | ABSOLUTE |
| No partial writes in final path | ABSOLUTE |

