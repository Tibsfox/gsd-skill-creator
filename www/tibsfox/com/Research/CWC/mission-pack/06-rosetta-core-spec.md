# Rosetta Core — Component Specification

**Milestone:** Cooking with Claude
**Wave:** 1A (Track A)
**Model Assignment:** Opus (engine), Sonnet (registry)
**Estimated Tokens:** ~40K combined
**Dependencies:** Wave 0 shared types, Panel Interface contract
**Produces:** `rosetta-core/engine.ts`, `rosetta-core/concept-registry.ts`, `rosetta-core/panel-router.ts`, `rosetta-core/expression-renderer.ts`

---

## Objective

Implement the Rosetta Core as skill-creator's fundamental translation engine — the logic that says "I understand this concept, and I can express it in whatever form you need." The Rosetta Core is not a feature of skill-creator; it IS skill-creator. Every operation — from skill generation to feedback calibration to knowledge exploration — passes through concept identification and panel-appropriate expression.

## Context

### The Three Rosetta Patterns

The Rosetta Stone (196 BC) carried the same text in three scripts. Rosetta Code (2007) presents the same 1,342+ programming tasks across 988 languages. Claude natively traverses dozens of human and programming languages. All three share the same principle: understanding doesn't live in any single expression — it lives in the *relationship between* expressions.

Skill-creator's Rosetta Core operationalizes this principle. A concept has a canonical identity (what it IS) and multiple panel expressions (how it's SAID). The core maintains identity while panels vary expression.

### Lisp's Homoiconicity as Architectural Model

Lisp's "code is data, data is code" property — homoiconicity — is the purest existing implementation of the Rosetta principle. In Lisp, a program and its data share the same representation (S-expressions). The Rosetta Core extends this: a concept, its code expression, its natural language explanation, and its pedagogical annotation share the same underlying structure — a `RosettaConcept` — expressed through different panels.

### Connection to Existing Architecture

The Rosetta Core integrates with:
- **Unit circle architecture** — Concept positions on the Complex Plane of Experience inform panel selection (concepts near θ=0 favor concrete panels like C++; concepts near θ=π/2 favor abstract panels like Lisp)
- **Token budget pipeline** — Panel loading respects the 2-5% ceiling via progressive disclosure
- **Observation pipeline** — Pattern detection in concept exploration feeds back to refine panel routing

## Technical Specification

### Concept Registry

```typescript
interface ConceptRegistry {
  // Core CRUD
  register(concept: RosettaConcept): void;
  get(id: string): RosettaConcept | undefined;
  search(query: string, domain?: string): RosettaConcept[];
  
  // Relationship navigation
  getDependencies(id: string): RosettaConcept[];
  getAnalogies(id: string, targetDomain: string): RosettaConcept[];
  getCrossReferences(id: string): CrossReference[];
  
  // Panel operations
  getPanelExpression(conceptId: string, panelId: PanelId): PanelExpression | undefined;
  getAvailablePanels(conceptId: string): PanelId[];
  
  // Complex Plane integration
  getByPosition(theta: number, radius: number, tolerance: number): RosettaConcept[];
  getNearestConcepts(position: ComplexPosition, count: number): RosettaConcept[];
}
```

**Storage:** Concepts stored as structured files in `.college/departments/*/concepts/`. Registry builds an in-memory index on load, with lazy loading of full concept data via progressive disclosure.

**Dependency Resolution:** When a concept depends on others (e.g., "derivative" depends on "limit"), the registry resolves the dependency chain and loads prerequisites. Circular dependencies are detected and flagged.

### Panel Router

```typescript
interface PanelRouter {
  // Select best panel(s) for a given context
  selectPanels(
    conceptId: string,
    context: TranslationContext
  ): PanelSelection;
  
  // Register available panels
  registerPanel(panel: Panel): void;
  
  // Query panel capabilities
  getPanelCapabilities(panelId: PanelId): PanelCapability[];
}

interface TranslationContext {
  userExpertise: ExpertiseLevel;     // novice → intermediate → advanced → expert
  requestedFormat?: PanelId;         // explicit panel request overrides routing
  currentDomain: string;             // which department/wing the user is in
  recentPanels: PanelId[];           // panels used recently (avoid repetition OR prefer consistency)
  learningObjective?: string;        // what the user is trying to learn
  taskType: 'explain' | 'implement' | 'compare' | 'debug' | 'explore';
}

interface PanelSelection {
  primary: PanelId;                  // The main expression panel
  secondary?: PanelId[];             // Supporting panels for comparison/illustration
  rationale: string;                 // Why these panels were selected
}
```

**Routing Logic:**
1. If user explicitly requests a panel ("show me in Python"), use that panel
2. If task is implementation, prefer the language closest to the target platform
3. If task is explanation, prefer the panel closest to the user's expertise level
4. If task is comparison, select 2-3 panels that illuminate different aspects
5. If task is exploration, suggest panels the user hasn't seen yet
6. Complex Plane position influences selection: concrete concepts favor systems panels; abstract concepts favor heritage panels

### Expression Renderer

```typescript
interface ExpressionRenderer {
  // Render a concept through a specific panel
  render(
    concept: RosettaConcept,
    panel: PanelId,
    depth: 'summary' | 'active' | 'deep'
  ): RenderedExpression;
  
  // Render with calibration applied
  renderCalibrated(
    concept: RosettaConcept,
    panel: PanelId,
    calibration: CalibrationProfile
  ): RenderedExpression;
}

interface RenderedExpression {
  content: string;                   // The expression itself
  panelId: PanelId;
  pedagogicalNotes?: string;         // What this expression teaches
  crossReferences?: string[];        // Related concepts to explore
  tokenCost: number;                 // Actual token cost of this rendering
}
```

**Rendering Depth:**
- **Summary** (~200 tokens): Concept name, one-line description, key relationships
- **Active** (~1K tokens): Code or explanation, core examples, immediate cross-references
- **Deep** (~5K+ tokens): Full implementation, pedagogical annotations, historical context, multiple examples

### Core Engine

```typescript
class RosettaCore {
  private registry: ConceptRegistry;
  private router: PanelRouter;
  private renderer: ExpressionRenderer;
  private calibrationEngine: CalibrationEngine;
  
  // The fundamental operation: translate a concept for a user
  async translate(
    conceptId: string,
    context: TranslationContext
  ): Promise<Translation> {
    const concept = this.registry.get(conceptId);
    if (!concept) throw new ConceptNotFoundError(conceptId);
    
    const panels = this.router.selectPanels(conceptId, context);
    const primary = this.renderer.renderCalibrated(
      concept, panels.primary, 
      this.getUserCalibration(context)
    );
    
    const secondary = panels.secondary?.map(p => 
      this.renderer.render(concept, p, 'summary')
    );
    
    return { primary, secondary, concept, panels };
  }
  
  // Process feedback — the Rosetta Stone gets sharper with use
  async processFeedback(
    translationId: string,
    feedback: UserFeedback
  ): Promise<CalibrationDelta> {
    return this.calibrationEngine.process(translationId, feedback);
  }
}
```

## Implementation Steps

1. Define and export all shared types from Wave 0 (`types.ts`)
2. Implement ConceptRegistry with file-based storage and in-memory indexing
3. Implement PanelRouter with the 6-step routing logic
4. Implement ExpressionRenderer with three depth levels and token counting
5. Wire together as RosettaCore class with translate() and processFeedback()
6. Implement concept dependency resolution with circular dependency detection
7. Add Complex Plane position integration for routing decisions
8. Write unit tests for each component and integration tests for the full translate() pipeline

## Test Cases

| Test | Input | Expected Output |
|------|-------|----------------|
| Basic translation | conceptId="exponential-decay", context={expertise: novice, format: python} | Python code with explanation, <1K tokens |
| Panel routing — explicit | context={requestedFormat: 'lisp'} | Lisp panel selected regardless of other signals |
| Panel routing — expertise | context={expertise: expert, taskType: 'implement'} | Systems panel (C++/Java) preferred |
| Panel routing — exploration | context={recentPanels: ['python','cpp'], taskType: 'explore'} | Heritage panel suggested (not Python or C++) |
| Dependency resolution | conceptId="derivative" (depends on "limit") | "limit" loaded as prerequisite |
| Circular dependency | Two concepts referencing each other | Error flagged, no infinite loop |
| Token budget | depth='summary' | Rendered expression ≤200 tokens |
| Calibration feedback | feedback="too technical" | Next translation uses simpler language/panel |
| Cross-domain analogy | conceptId="exponential-decay", targetDomain="cooking" | Returns "cooling curve" analogy |

## Verification Gate

- [ ] Concept Registry stores and retrieves 10+ test concepts correctly
- [ ] Panel Router selects appropriate panel for all test context vectors
- [ ] Expression Renderer produces correct output at all three depth levels
- [ ] Token cost never exceeds progressive disclosure limits
- [ ] Feedback processing produces measurable calibration adjustment
- [ ] No type errors (`npx tsc --noEmit`)
- [ ] All test cases pass

## Safety Boundaries

- Concept rendering must respect token budget — never load more than the user's allocation allows
- Panel routing must never suppress safety-relevant panels (if a cooking concept has safety implications, the safety panel must be consulted regardless of routing preferences)
- Calibration adjustments bounded by the 20% content change rule — no single feedback cycle changes panel selection or rendering depth by more than 20%
