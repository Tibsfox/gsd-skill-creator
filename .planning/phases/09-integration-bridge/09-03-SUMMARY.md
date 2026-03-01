---
phase: 09-integration-bridge
plan: 03
subsystem: integration-bridge
tags: [chipset, panel-routing, declarative-config, engine-mapping]
dependency_graph:
  requires: [PanelId]
  provides: [ChipsetAdapter, PanelChipsetMapping, ChipsetAdapterConfig, PanelRouteResult, EngineResolver, DEFAULT_PANEL_MAPPING]
  affects: [chipset-engine-routing]
tech_stack:
  added: []
  patterns: [declarative-mapping, interface-decoupling, fallback-routing]
key_files:
  created:
    - .college/integration/chipset-adapter.ts
    - .college/integration/chipset-adapter.test.ts
  modified: []
decisions:
  - EngineResolver minimal interface keeps .college/ decoupled from src/chipset/
  - Declarative Record mapping instead of if/else chains for panel routing
  - Fallback domain defaults to glue (router engine) for unmapped panels
metrics:
  duration: "2 min"
  completed: "2026-03-01"
  tests_added: 12
  tests_total: 562
---

# Phase 9 Plan 3: ChipsetAdapter Summary

ChipsetAdapter maps all 11 Rosetta panels to chipset engine domains via declarative configuration with EngineResolver decoupling.

## What Was Built

- **ChipsetAdapter class** at `.college/integration/chipset-adapter.ts`
  - DEFAULT_PANEL_MAPPING covering all 11 PanelId values
  - Systems panels (python, cpp, java) -> context engine (60% budget)
  - Heritage panels (lisp, pascal, fortran, perl, algol) -> output engine (15%)
  - Frontier panel (unison) -> io engine (15%)
  - Natural/vhdl -> glue engine (10%, router)
  - `getDomainForPanel()`, `resolveEngine()`, `routePanelRequest()`, `getMapping()`
  - Custom config overrides merge with defaults
- **12 tests** covering all panels, routing, overrides, fallbacks, edge cases

## Decisions Made

1. **EngineResolver interface**: Minimal `{ getByDomain(domain) }` avoids importing from src/chipset/
2. **Declarative Record mapping**: `Record<PanelId, EngineDomain>` instead of procedural routing logic
3. **Fallback to glue**: Unknown/unmapped panels route to the router engine (integration/glue domain)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx vitest run .college/integration/chipset-adapter.test.ts` -- 12/12 pass
- No direct imports from src/ in the adapter
- DEFAULT_PANEL_MAPPING covers all 11 PanelId values
- Fallback routing works for unmapped panels
