# PNW Millwork Co-op Network — Test Plan

**Total Tests:** 52 | **Safety-Critical:** 8 | **Target Coverage:** 100% of success criteria
**Test density target:** ~5 tests per success criterion (legal/governance domains warrant higher density)

---

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|----------------|
| Safety-critical (legal + physical safety) | 8 | Mandatory | BLOCK release |
| Core functionality | 28 | Required | BLOCK release |
| Integration | 10 | Required | BLOCK release |
| Edge cases | 6 | Best-effort | LOG |

---

## Safety-Critical Tests (Mandatory Pass — Blocking)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| SC-01 | Acquisition-protection bylaws present | Bylaws explicitly restrict equity transfer to non-workers; no mechanism for hostile acquisition | 02-network-legal |
| SC-02 | OSHA woodworking compliance addressed | Finish room VOC controls, CNC guarding, wood dust PEL — all three addressed in production playbook | 03-production-model |
| SC-03 | RCW 23.86 minimum requirements met | Articles include all mandatory provisions: member definition, voting rights, patronage dividends | 02-network-legal |
| SC-04 | FSC certification is on critical path | Supply chain map confirms FSC CoC application timeline; no client contract template shipped without FSC clause | 05-supply-chain |
| SC-05 | AWI grade compliance specified | Production playbook specifies AWI Custom or Premium grade; no output ships below AWI Economy | 03-production-model |
| SC-06 | Member equity non-transferable | Federation agreement confirms equity is non-transferable outside worker membership at all nodes | 02-network-legal |
| SC-07 | Capitalization has 3 pathways | No single-pathway capitalization plan accepted; CDFI + SBA + member equity all present | 02-network-legal |
| SC-08 | FoxEdu integration point documented | Workforce pipeline explicitly references Fox Infrastructure Group workforce track alignment | 06-workforce-pipeline |

---

## Core Functionality Tests

### Component 00: Shared Types
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-00-01 | Node profile schema complete | Node North data | Valid entity schema with all required fields |
| CF-00-02 | BOM standard schema | Sample fixture BOM | All required BOM fields present and typed |
| CF-00-03 | Compliance checklist coverage | Legal + safety domains | All 6 compliance domains present (RCW, FSC, OSHA, AWI, CARB, WA L&I) |

### Component 01: Node North Anchor
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-01-01 | Location rationale documented | Everett/Snohomish County | Specific location criteria, proximity to Synsor footprint, industrial zoning |
| CF-01-02 | Founding cohort profile complete | Worker-owner model | 8–12 person cohort, skill mix, former Synsor alumni pathway |
| CF-01-03 | Equipment list complete | Commercial millwork baseline | CNC router, wide-belt sander, finish room, edge bander — all present |
| CF-01-04 | Capitalization estimate present | Node North scope | CapEx estimate for equipment + leasehold improvement |

### Component 02: Network Legal
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-02-01 | Individual node co-op structure | RCW 23.86 | Articles of incorporation template with all required provisions |
| CF-02-02 | Federation structure | Multi-node model | Inter-co-op agreement template defining revenue split, contract holding, dispute resolution |
| CF-02-03 | One member, one vote | Governance model | Bylaws confirm voting structure; no super-voting shares |
| CF-02-04 | Patronage dividend formula | Revenue model | Formula distributes profit by labor contribution, not capital |
| CF-02-05 | NWCDC referral documented | Formation support | NWCDC contact, advisory engagement recommended as Step 1 |

### Component 03: Production Ops Playbook
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-03-01 | BOM-first flow documented | SOW example | Step-by-step SOW → BOM → CNC program → production flow |
| CF-03-02 | Lean scheduling present | Pull scheduling model | Work order release process, no-overproduction rule documented |
| CF-03-03 | Finish room process | Color-match rollout scenario | Consistent color matching protocol for identical-unit rollouts |
| CF-03-04 | AWI grade inspection | Production output | Inspection checklist against AWI Custom/Premium criteria |
| CF-03-05 | CNC program version control | Engineering ops | Software/version control recommendation present |
| CF-03-06 | Multi-node production protocol | 200-unit rollout across 2 nodes | Protocol for splitting a single order across Node North + Node South |

### Component 04: Client Pipeline
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-04-01 | Named Starbucks target present | Alumni connection data | Specific outreach target identified with rationale |
| CF-04-02 | Named Alaska Airlines path | Client relationship model | Procurement team entry point documented |
| CF-04-03 | Hotel chain pathway | FF&E procurement model | Interior design firm intermediary pathway documented |
| CF-04-04 | Warm outreach template | Starbucks target | Outreach message template — not cold pitch; references shared PNW history |
| CF-04-05 | SOW response template | Sample SOW | Structured response template with BOM acknowledgment, timeline, grade commitment |

### Component 05: Supply Chain
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-05-01 | Primary hardwood supplier identified | Emerson Hardwood | Account opening process, volume pricing pathway documented |
| CF-05-02 | Sheet goods supplier identified | OrePac | Commercial account pathway, I-5 distribution locations documented |
| CF-05-03 | FSC CoC application timeline | Certification pathway | 3–6 month timeline with certification body contacts |
| CF-05-04 | CARB-compliant finish materials | VOC compliance | Sherwin-Williams product lines or equivalent documented |
| CF-05-05 | Backup supplier for each category | Supply chain resilience | Primary + backup identified for hardwood, sheet goods, finish |

### Component 06: Workforce Pipeline
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-06-01 | Sno-Isle TECH partnership outline | Workforce model | Specific program proposal, contact pathway, curriculum outline |
| CF-06-02 | 3-year apprenticeship structure | AWI + co-op model | Year 1/2/3 curriculum and shop floor progression documented |
| CF-06-03 | Equity accrual from day one | Co-op ownership model | Membership share purchase pathway for apprentices documented |
| CF-06-04 | Former Synsor alumni strategy | Institutional memory | LinkedIn search strategy + master instructor role defined |
| CF-06-05 | FoxEdu integration point | Fox Infrastructure Group plan | Explicit connection to "Advanced Fabrication & Manufacturing" workforce track |

---

## Integration Tests

| Test ID | Interface Between | Scenario | Expected Behavior |
|---------|------------------|----------|-------------------|
| IT-01 | Node North → Network Legal | Node North incorporated as RCW 23.86 entity | Node profile schema validates against legal entity template |
| IT-02 | Production Model → Client Pipeline | Client sends 200-unit SOW | Production model generates BOM; client pipeline SOW template aligns |
| IT-03 | Supply Chain → Production Model | FSC material sourced | FSC-certified source traces through BOM to finished unit |
| IT-04 | Workforce Pipeline → Node North | Apprentice completes Year 1 | Equity accrual mechanism triggers; shop floor role progression documented |
| IT-05 | Network Legal → Client Pipeline | Federated contract signed | Revenue split formula in federation agreement applies to this contract |
| IT-06 | Supply Chain → Client Pipeline | LEED client requirement | FSC + CARB finishes in supply chain satisfy client spec |
| IT-07 | Node North → Production Model | First CNC program run | BOM-first flow initiates at Node North using documented playbook |
| IT-08 | Network Legal → Workforce Pipeline | Apprentice becomes worker-owner | Bylaws confirm pathway from apprentice equity → full member equity |
| IT-09 | Production Model → Verification | 200-unit rollout across 2 nodes | Multi-node production protocol produces spec-compliant identical units |
| IT-10 | All Components → NWCDC Package | Full package assembled | All 10 success criteria satisfied; package ready for NWCDC presentation |

---

## Edge Case Tests

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| EC-01 | Anchor client acquisition attempt | Bylaws block transfer; worker vote required; board declines on behalf of membership |
| EC-02 | FSC certification lapses during active contract | Protocol notifies client; no FSC-claimed shipments; re-certification fast-tracked |
| EC-03 | Node North founding cohort < 8 workers | Minimum viability threshold triggers — spec recommends holding formation until cohort reaches 8 |
| EC-04 | Primary hardwood supplier stockout | Backup supplier protocol activates; lead time adjustment communicated to client |
| EC-05 | Apprentice leaves before Year 3 | Equity accrual terms define partial-vesting schedule; departure process documented |
| EC-06 | Out-of-spec units identified post-production | AWI inspection protocol triggers rework; client notification threshold defined |

---

## Verification Matrix

*Every success criterion from the vision doc maps to ≥2 tests.*

| Success Criterion | Test IDs | Status |
|-------------------|----------|--------|
| 1. RCW 23.86 filing-ready with acquisition-protection bylaws | SC-01, SC-03, SC-06, CF-02-01, CF-02-03 | Pending |
| 2. Node North founding spec (location, cohort, capitalization) | CF-01-01, CF-01-02, CF-01-03, CF-01-04, SC-07 | Pending |
| 3. Production ops playbook (BOM-first, AWI compliant) | SC-02, SC-05, CF-03-01, CF-03-02, CF-03-03, CF-03-04 | Pending |
| 4. Client pipeline with 3+ named targets | CF-04-01, CF-04-02, CF-04-03, CF-04-04 | Pending |
| 5. Timber/materials supply chain with FSC pathway | SC-04, CF-05-01, CF-05-02, CF-05-03, CF-05-04, CF-05-05 | Pending |
| 6. Sno-Isle TECH partnership design | CF-06-01, CF-06-02, CF-06-03 | Pending |
| 7. Network governance (distribution, revenue split, disputes) | CF-02-02, CF-02-04, IT-05 | Pending |
| 8. Phased capitalization plan (3 pathways) | SC-07, CF-02-05 | Pending |
| 9. Multi-node quality verification system | CF-03-06, IT-09, EC-06 | Pending |
| 10. Package ready for NWCDC presentation | SC-08, IT-10, CF-06-05 | Pending |
