---
name: visualization-team
type: team
category: data-science
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/data-science/visualization-team/README.md
description: Focused visualization and communication team for data display, dashboard design, visual critique, and data storytelling. Tufte handles chart design and visual honesty, Nightingale provides data context and narrative structure, Benjamin reviews visualizations for bias and equity, and Cairo ensures the output builds data literacy in the audience. Use for dashboard projects, publication-quality graphics, visualization audits, and data storytelling tasks.
superseded_by: null
---
# Visualization Team

Focused team for data visualization, dashboard design, visual critique, and data storytelling. Combines design expertise, data context, ethical review, and pedagogical communication into a unified visualization workflow.

## When to use this team

- **Dashboard projects** requiring cohesive multi-chart design, interaction planning, and audience adaptation.
- **Publication-quality graphics** for reports, papers, or presentations where visual honesty and clarity are paramount.
- **Visualization audits** -- reviewing existing charts, dashboards, or reports for effectiveness, honesty, and accessibility.
- **Data storytelling** -- translating analytical findings into compelling, honest narratives with supporting visualizations.
- **Equity-aware visualization** -- ensuring that charts do not misrepresent the experience of different demographic groups and that the visual framing is fair.
- **Data literacy materials** -- creating visualizations designed to teach readers how to interpret data.

## When NOT to use this team

- **Exploratory visualization for the analyst** -- use `tukey` for quick EDA plots.
- **Full analysis pipeline** including modeling and experimentation -- use `data-analysis-team`.
- **Simple chart creation** where the design is already specified -- use `tufte` directly.
- **Ethics-only review** with no visualization component -- use `benjamin` directly.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Visualization designer** | `tufte` | Chart design, data-ink ratio, small multiples, critique | Sonnet |
| **Data context / Router** | `nightingale` | Data understanding, narrative structure, synthesis | Opus |
| **Ethics reviewer** | `benjamin` | Bias in visual framing, equity of representation, accessibility | Sonnet |
| **Pedagogy specialist** | `cairo` | Data literacy, audience adaptation, critical reading | Sonnet |

One Opus agent (Nightingale) provides the deep reasoning needed for narrative synthesis and data context. Three Sonnet agents handle well-structured tasks -- design application, ethics checklist, and pedagogical adaptation.

## Orchestration flow

```
Input: visualization task + data reference + audience + purpose
        |
        v
+---------------------------+
| Nightingale (Opus)        |  Phase 1: Context
| Data understanding        |          - what does the data show?
+---------------------------+          - what is the key finding?
        |                              - what is the narrative arc?
        |
        +--------+--------+
        |                 |
        v                 v
    Tufte (Sonnet)    Benjamin (Sonnet)
    (design)          (equity review)
        |                 |
    Phase 2: Design + Review (parallel)
        |     - Tufte: chart type selection, layout, annotation
        |     - Benjamin: representation fairness, framing bias,
        |       accessibility compliance
        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Cairo (Sonnet)            |  Phase 3: Communication
      | Audience adaptation       |          - match audience level
      +---------------------------+          - add literacy scaffolding
                 |                           - annotate for comprehension
                 v
      +---------------------------+
      | Nightingale (Opus)        |  Phase 4: Synthesize
      | Final integration         |          - merge design + ethics + pedagogy
      +---------------------------+          - produce DataVisualization record
                 |
                 v
          Final visualization specification
          + DataVisualization + DataExplanation records
```

Nightingale provides the data context first -- what the chart needs to show, what the finding is, what the audience needs to understand. Tufte and Benjamin then work in parallel -- Tufte designs the chart while Benjamin reviews the design choices for equity and accessibility. Cairo adapts the annotations and explanatory text for the audience. Nightingale integrates everything into the final output.

## Synthesis rules

### Rule 1 -- Honesty is non-negotiable

If Benjamin identifies that a visualization frames data in a way that disadvantages or misrepresents a group, the design must be revised even if the current design is aesthetically superior. Tufte's principles align with this -- honest visualization is good visualization.

### Rule 2 -- The audience determines the form

Cairo's assessment of the audience level determines the annotation density, vocabulary, and scaffolding. A chart for executives looks different from a chart for analysts, even when showing the same data. The data does not change; the framing does.

### Rule 3 -- Accessibility is a design requirement

Benjamin's accessibility review (color blindness, contrast ratios, screen reader compatibility) is not a nice-to-have. Charts that exclude 8% of the male population from reading them are failed charts. Tufte incorporates accessibility findings into the design, not as an afterthought but as a constraint.

### Rule 4 -- Context before detail

Nightingale ensures every visualization has context: what is the reader supposed to learn? What comparison is being made? What is the baseline? A beautiful chart without context is a beautiful failure.

## Input contract

The team accepts:

1. **Visualization task** (required). Design request, critique request, or dashboard project.
2. **Data reference** (required for design). Path or description of the underlying data.
3. **Audience** (required). Who will see this (executives, analysts, general public, regulators, students).
4. **Purpose** (optional). Exploration, presentation, publication, dashboard, or data literacy.

## Output contract

### Primary output

A visualization specification containing:

- Chart type and layout decisions with rationale
- Variable-to-channel mappings
- Annotation strategy (title, labels, callouts, source)
- Color palette with accessibility certification
- Equity review findings
- Audience-adapted explanatory text

### Grove records

- `DataVisualization` -- Tufte's design specification with honesty and accessibility checks
- `DataExplanation` -- Cairo's audience-adapted narrative and literacy scaffolding

## Configuration

```yaml
name: visualization-team
chair: nightingale
specialists:
  - visualization: tufte
  - ethics: benjamin
pedagogy: cairo

parallel: false  # Nightingale context first, then Tufte + Benjamin parallel, then Cairo
timeout_minutes: 10

min_specialists: 2
```

## Invocation

```
# Dashboard design
> visualization-team: Design a quarterly business review dashboard for our
  executive team. Data includes revenue, churn, NPS, and support tickets.

# Publication graphics
> visualization-team: Create publication-quality figures for our research paper
  on income inequality trends across racial groups.

# Visualization audit
> visualization-team: Review our company's annual report charts for honesty,
  clarity, and accessibility.

# Data storytelling
> visualization-team: Tell the story of how customer behavior changed during
  COVID using this transaction dataset. Audience: general public.

# Equity-aware visualization
> visualization-team: We need to show health outcome disparities across racial
  groups without reinforcing stereotypes. How should we design these charts?
```

## Limitations

- No modeling capability -- if the visualization needs underlying statistical analysis, involve Tukey or Breiman separately, or escalate to data-analysis-team.
- No experimental design -- if the data comes from an experiment that needs validation, involve Fisher separately.
- The team produces specifications and code, not pixel-perfect final renders -- actual rendering depends on the visualization library and tools available.
- Equity review depends on the context being provided. Benjamin cannot assess fairness of representation without knowing who the affected populations are.
