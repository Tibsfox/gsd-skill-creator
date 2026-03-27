# Shared Types + Compliance Checklist — Component Specification

**Milestone:** PNW Millwork Co-op Network
**Wave:** 0 | **Track:** —
**Model Assignment:** Haiku
**Estimated Tokens:** ~6K
**Dependencies:** None
**Produces:** entity-schemas, BOM standard schema, compliance checklist

---

## Objective

Define the shared schemas, data types, and compliance baseline that all Wave 1 agents consume. Every downstream component uses the node profile schema, BOM standard, and compliance checklist defined here. Wave 0 must complete within 5 minutes to stay within the cache TTL window.

## Context

This network consists of worker co-op nodes (legal entities under RCW 23.86), a federated contracting entity, production operations (CNC woodworking and architectural millwork), client contracts (commercial fixtures at scale), and a supply chain (timber + sheet goods + finishes). The shared types must cover the data structures flowing between all of these.

The BOM (Bill of Materials) is the central artifact of the production methodology — it is the translation layer between a client's scope of work and the shop floor's work orders. Every schema should make this flow legible.

## Technical Specification

### Node Profile Schema
```
NodeProfile {
  id: string                    // e.g., "node-north-everett"
  name: string                  // e.g., "Node North — Everett/Snohomish"
  location: {
    address: string
    county: string
    state: "WA" | "OR"
    latitude: float
    longitude: float
  }
  legal_entity: {
    type: "RCW_23.86_worker_coop"
    status: "forming" | "filed" | "active"
    ein: string | null
    formation_date: date | null
  }
  capacity: {
    worker_owners: integer
    apprentices: integer
    cnc_tables: integer         // number of CNC router tables
    finish_room: boolean
    square_footage: integer
  }
  certifications: {
    fsc_coc: boolean
    fsc_expiry: date | null
    awi_grade: "Economy" | "Custom" | "Premium" | null
    osha_current: boolean
  }
  specializations: string[]     // e.g., ["store-fixtures", "hotel-millwork", "case-goods"]
}
```

### BOM Line Item Schema
```
BOMLineItem {
  item_id: string
  description: string
  material_species: string      // e.g., "cherry", "maple", "MDF"
  material_grade: string        // e.g., "FAS", "1-Common", "Industrial"
  fsc_required: boolean
  quantity: float
  unit: "bd_ft" | "sq_ft" | "linear_ft" | "each" | "sheet"
  supplier_primary: string
  supplier_backup: string
  unit_cost_estimate: float | null
  cnc_program_ref: string | null  // reference to CNC program file
  finish_spec: string | null      // e.g., "SW-Autumn Wheat stain + Resisthane topcoat"
  awi_grade: "Economy" | "Custom" | "Premium"
}
```

### Contract Template Schema
```
ClientContract {
  contract_id: string
  client_name: string
  project_name: string
  sow_date: date
  delivery_date: date
  unit_quantity: integer
  awi_grade_required: "Economy" | "Custom" | "Premium"
  fsc_required: boolean
  leed_required: boolean
  carb_required: boolean
  production_nodes: string[]    // node IDs contributing to this contract
  revenue_split: {              // keyed by node ID
    [node_id: string]: float    // percentage of contract revenue
  }
  total_value: float | null
  status: "bid" | "awarded" | "in_production" | "delivered" | "invoiced"
}
```

## Compliance Checklist

All Wave 1 agents must verify their component addresses each of these compliance domains:

| Domain | Standard | Required By | Gate Level |
|--------|----------|-------------|------------|
| **Co-op Legal** | RCW 23.86 (WA) | Node formation | ABSOLUTE |
| **FSC Chain of Custody** | FSC-STD-40-004 | Starbucks, hotel clients | GATE |
| **OSHA Woodworking** | 29 CFR 1910.212, 1910.94, 1910.1000 | Node North operations | ABSOLUTE |
| **AWI Quality Standards** | AWI Quality Standards Illustrated (current ed.) | All production output | ABSOLUTE |
| **CARB VOC** | CA Air Resources Board ATCM | Finish room; LEED clients | GATE |
| **WA L&I Apprenticeship** | WAC 296-05 | Workforce pipeline | ANNOTATE |

## Implementation Steps

1. Define NodeProfile schema and validate with Node North sample data
2. Define BOMLineItem schema and validate with a sample 5-item fixture BOM
3. Define ClientContract schema and validate with a sample Starbucks scenario
4. Produce compliance checklist table with all 6 domains
5. Export all schemas as markdown + TypeScript interface stubs for downstream use

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| CF-00-01 | Node North profile data | Valid NodeProfile | All required fields present; certifications schema correct |
| CF-00-02 | Sample 5-item BOM | Valid BOMLineItem array | All items typed; FSC and AWI fields present |
| CF-00-03 | Compliance domain list | 6-domain checklist | All 6 domains: RCW, FSC, OSHA, AWI, CARB, WA L&I |

## Verification Gate

Before marking complete:
- [ ] NodeProfile schema covers all fields needed by Components 01 and 06
- [ ] BOMLineItem schema covers all fields needed by Components 03, 04, and 05
- [ ] ClientContract schema covers all fields needed by Components 02 and 04
- [ ] Compliance checklist covers all 6 domains
- [ ] All schemas exported in both markdown table and TypeScript interface format
- [ ] Wave 0 total time < 5 minutes (cache TTL constraint)

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| Equity transfer fields must default to non-transferable | ABSOLUTE |
| FSC field must default to required=true for all client contracts | GATE |
| AWI grade must never default to null in a shipped contract | ABSOLUTE |
