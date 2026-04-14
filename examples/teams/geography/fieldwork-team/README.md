---
name: fieldwork-team
type: team
category: geography
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/geography/fieldwork-team/README.md
description: Focused fieldwork design and execution team for geographic field research. Carson leads with observation protocol and environmental communication, Humboldt provides integrated field strategy in the Humboldtian tradition, Sauer contributes cultural landscape reading methods, and Tobler handles GPS, spatial data collection, and field-to-GIS pipeline design. Use for planning field studies, designing sampling strategies, interpreting field observations, or connecting field data to broader geographic analysis. Not for desk-based analysis, pure cartographic tasks, or geopolitical questions.
superseded_by: null
---
# Fieldwork Team

A focused four-agent team for geographic field research design, execution support, and field data interpretation. Carson leads observation protocol; Humboldt provides integrated field strategy; Sauer contributes cultural landscape reading; Tobler handles spatial data collection and GIS integration.

## When to use this team

- **Field study design** -- "How would I study coastal erosion at this site?" or "Design a sampling strategy for mapping urban heat islands."
- **Observation protocol development** -- building structured observation frameworks for physical or cultural landscape analysis.
- **Field data interpretation** -- connecting field observations to geographic processes and patterns.
- **Sampling strategy** -- selecting appropriate sampling methods (random, systematic, stratified, purposive) for a specific research question.
- **Field-to-GIS pipeline** -- planning how field data will be collected, formatted, and integrated into spatial analysis.
- **Environmental monitoring** -- designing measurement protocols for streams, soils, weather, vegetation, or pollution.

## When NOT to use this team

- **Desk-based analysis** where no fieldwork is involved -- use the analysis team or individual specialists.
- **Pure cartographic tasks** -- use `tobler` directly.
- **Geopolitical analysis** -- use `said-g` via Humboldt.
- **Social survey design** without a spatial/landscape component -- use `massey` via Humboldt.

## Composition

Four agents, combining field observation expertise with spatial data skills:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Observation protocol** | `carson` | Environmental observation, sense of wonder, field communication | Sonnet |
| **Integrated field strategy** | `humboldt` | Multi-system field observation, cross-domain synthesis | Opus |
| **Cultural landscape** | `sauer` | Landscape reading, material evidence interpretation | Opus |
| **Spatial data / GPS** | `tobler` | GPS, field mapping, sampling design, GIS integration | Sonnet |

Two Opus agents (Humboldt, Sauer) because integrative field strategy and cultural landscape interpretation require deep contextual reasoning. Two Sonnet agents (Carson, Tobler) because observation protocol and spatial data tasks are well-bounded.

## Orchestration flow

```
Input: field research question + study area + research objectives
        |
        v
+---------------------------+
| Humboldt (Opus)           |  Phase 1: Frame the field study
| Integrated strategy       |          - identify research question
+---------------------------+          - determine what needs observing
        |                              - identify physical + cultural dimensions
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
    Carson    Sauer    Tobler   Humboldt
  (observation) (landscape) (spatial) (integration)
        |        |        |        |
    Phase 2: Specialists develop their components:
    - Carson: observation checklist, environmental monitoring
    - Sauer: landscape reading framework, cultural features to document
    - Tobler: sampling design, GPS protocol, data format, GIS workflow
    - Humboldt: cross-system connections to look for in the field
        |        |        |        |
        +--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Humboldt (Opus)           |  Phase 3: Synthesize into
              | Unified field plan       |           a coherent protocol
              +---------------------------+
                         |
                         v
                  Field study design
                  + FieldReport template
```

## Field study design output

A complete field study design includes:

1. **Research question** -- what the fieldwork aims to answer.
2. **Study area description** -- physical and cultural context from desk study.
3. **Sampling strategy** -- site selection method, number of sites, spatial distribution.
4. **Observation checklist** -- what to observe, measure, and record at each site.
5. **Equipment list** -- GPS, measuring instruments, cameras, notebooks, data sheets.
6. **GPS and mapping protocol** -- coordinate system, waypoint naming convention, track logging settings.
7. **Cultural landscape framework** -- features to identify, questions to ask about each feature.
8. **Environmental monitoring protocol** -- measurement methods, instruments, calibration, timing.
9. **Data recording format** -- field notebook structure, digital data entry forms, photograph conventions.
10. **Field-to-GIS pipeline** -- how data moves from field collection to spatial analysis.
11. **Safety and ethics** -- risk assessment, emergency procedures, consent protocols for interviews.

## Input contract

The team accepts:

1. **Field research question** (required). What the fieldwork aims to discover or document.
2. **Study area** (required). Where the fieldwork will take place.
3. **Research objectives** (optional). Specific outcomes expected from the fieldwork.
4. **Constraints** (optional). Time, budget, equipment, access limitations.

## Configuration

```yaml
name: fieldwork-team
chair: humboldt
specialists:
  - observation: carson
  - landscape: sauer
  - spatial: tobler

parallel: true
timeout_minutes: 10

auto_skip: false
min_specialists: 3
```

## Invocation

```
# Physical geography fieldwork
> fieldwork-team: Design a field study to measure coastal erosion rates
  along a 2km stretch of sandstone bluff. Study area: Pacific Northwest coast.

# Cultural landscape fieldwork
> fieldwork-team: How would I conduct a cultural landscape survey of an
  abandoned mining town in the Cascades? Constraints: one day, hiking access only.

# Environmental monitoring
> fieldwork-team: Design a stream monitoring protocol for a watershed
  restoration project. Study area: a second-order stream in western Washington.

# Urban fieldwork
> fieldwork-team: Plan a field study of urban heat islands in a mid-sized
  US city. Constraints: 3 days, one GPS unit, one thermal sensor.
```
