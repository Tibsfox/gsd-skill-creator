---
name: mapping-team
type: team
category: geography
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/geography/mapping-team/README.md
description: Focused mapping and spatial analysis team for cartographic design, GIS analysis, and spatial data visualization. Tobler leads with projection selection, spatial analysis, and cartographic design, Reclus provides physical geography content for environmental and physical maps, Massey provides social data analysis and critical cartography perspectives, and Carson ensures map communication is accessible and honest. Use for thematic map design, spatial analysis workflows, remote sensing interpretation, or cartographic critique. Not for pure text-based analysis, fieldwork planning, or geopolitical narrative.
superseded_by: null
---
# Mapping Team

A focused four-agent team for cartographic design, spatial analysis, and geographic data visualization. Tobler leads with spatial methods; Reclus provides physical content; Massey provides social data and critical perspective; Carson ensures the output communicates effectively.

## When to use this team

- **Thematic map design** -- choosing projections, classification methods, symbolization, and color schemes for a specific data visualization.
- **GIS analysis workflows** -- designing multi-step spatial analyses (overlay, buffer, interpolation, network analysis) for a research question.
- **Remote sensing interpretation** -- selecting satellite platforms, computing spectral indices, interpreting land cover change.
- **Cartographic critique** -- evaluating existing maps for projection appropriateness, classification bias, visual hierarchy, and honesty.
- **Spatial statistics** -- testing for spatial autocorrelation, identifying clusters, building spatial regression models.
- **Map communication** -- ensuring maps are accessible, accurate, and appropriate for their audience.

## When NOT to use this team

- **Pure text-based analysis** with no spatial component -- use the analysis team.
- **Fieldwork planning** -- use `fieldwork-team`.
- **Geopolitical narrative analysis** -- use `said-g` via Humboldt (though the mapping team can visualize geopolitical data).
- **Cultural landscape reading** that is observational rather than cartographic -- use `sauer` via Humboldt.

## Composition

Four agents, combining cartographic expertise with content knowledge and communication:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Cartographer** | `tobler` | Projection, GIS, spatial analysis, spatial statistics | Sonnet |
| **Physical content** | `reclus` | Physical geography data, environmental mapping, Earth observation | Opus |
| **Social content / Critique** | `massey` | Social data analysis, power-geometry of representation, critical cartography | Sonnet |
| **Communication** | `carson` | Map accessibility, audience adaptation, environmental visualization | Sonnet |

One Opus agent (Reclus) because physical geography content analysis requires deep process reasoning. Three Sonnet agents (Tobler, Massey, Carson) because their tasks are well-bounded.

## Orchestration flow

```
Input: mapping task + data description + purpose + audience
        |
        v
+---------------------------+
| Tobler (Sonnet)           |  Phase 1: Define the spatial problem
| Lead cartographer         |          - data type and structure
+---------------------------+          - projection requirements
        |                              - analysis method
        |                              - visualization strategy
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
    Tobler    Reclus    Massey   Carson
   (spatial) (physical) (social) (comms)
        |        |        |        |
    Phase 2: Specialists work in parallel:
    - Tobler: projection selection, classification method, spatial analysis design
    - Reclus: physical geography content, environmental data interpretation
    - Massey: social data analysis, critique of representational choices
    - Carson: audience assessment, accessibility review, communication strategy
        |        |        |        |
        +--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Tobler (Sonnet)           |  Phase 3: Integrate into
              | Unified map specification |           a cartographic plan
              +---------------------------+
                         |
                         v
              +---------------------------+
              | Carson (Sonnet)           |  Phase 4: Communication review
              | Accessibility + clarity   |          - is the map honest?
              +---------------------------+          - will the audience understand it?
                         |
                         v
                  Map specification
                  + SpatialModel Grove record
```

## Map specification output

A complete map specification includes:

1. **Purpose statement** -- what the map communicates and to whom.
2. **Projection** -- name, parameters, and rationale for choice.
3. **Data sources** -- datasets used, their resolution, currency, and quality assessment.
4. **Classification method** -- how continuous data is binned, with rationale.
5. **Symbolization** -- color palette, symbol types and sizes, visual hierarchy.
6. **Analysis workflow** -- GIS operations performed on the data before mapping.
7. **Critical review** -- what the map reveals, what it conceals, and what alternative representations would show.
8. **Communication notes** -- audience-specific adaptations, legend design, contextual information needed.
9. **Spatial statistics** -- autocorrelation tests, cluster analysis, or model diagnostics as appropriate.

## Input contract

The team accepts:

1. **Mapping task** (required). What map or spatial analysis to produce.
2. **Data description** (required). Available spatial data, formats, and sources.
3. **Purpose** (required). What the map or analysis is intended to communicate or discover.
4. **Audience** (optional). Who will use the map. Defaults to "general educated audience."

## Configuration

```yaml
name: mapping-team
chair: tobler
specialists:
  - physical: reclus
  - social: massey
communication: carson

parallel: true
timeout_minutes: 10

auto_skip: false
min_specialists: 2
```

## Invocation

```
# Thematic map design
> mapping-team: Design a choropleth map of food insecurity rates across
  US counties. Data: USDA Food Access Research Atlas. Audience: policy report.

# GIS analysis workflow
> mapping-team: Design a spatial analysis to identify optimal locations for
  new fire stations in a growing suburban area. Data: road network, population
  density, existing station locations, response time records.

# Remote sensing
> mapping-team: How would I use Sentinel-2 imagery to monitor deforestation
  in the Brazilian Amazon over 5 years? Data: Sentinel-2 Level 2A archive.

# Cartographic critique
> mapping-team: Evaluate this world map that uses a Mercator projection to
  show population density by country.

# Environmental visualization
> mapping-team: Create a map specification showing sea level rise scenarios
  for a coastal city. Audience: public town hall meeting.
```
