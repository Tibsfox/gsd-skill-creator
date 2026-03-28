# Panel Interface — Component Specification

**Milestone:** Cooking with Claude
**Wave:** 0.2 (Foundation) + 2B/2C (Implementation)
**Model Assignment:** Sonnet (interface + systems panels), Opus (Lisp panel)
**Estimated Tokens:** ~44K combined
**Dependencies:** Wave 0 shared types
**Produces:** `panels/panel-interface.ts`, `panels/python-panel.ts`, `panels/cpp-panel.ts`, `panels/java-panel.ts`, `panels/lisp-panel.ts`, `panels/pascal-panel.ts`, `panels/fortran-panel.ts`

---

## Objective

Define the standard interface that all Rosetta panels implement, then build six initial panels: three systems language panels (Python, C++, Java) and three heritage panels (Lisp, Pascal, Fortran). Each panel is both a functional code generator AND a pedagogical window — it doesn't just express a concept in a language, it teaches what that language reveals about the concept.

## Technical Specification

### Panel Interface Contract

```typescript
interface Panel {
  id: PanelId;
  name: string;
  family: 'systems' | 'heritage' | 'hardware' | 'structured' | 'data' | 'natural';
  paradigm: string;                    // 'imperative', 'functional', 'oo', 'procedural', 'descriptive'
  pedagogicalFocus: string;            // What exploring this panel teaches
  
  // Core capability: express a concept
  express(concept: RosettaConcept, depth: ExpressionDepth): PanelExpression;
  
  // Can this panel express a given concept?
  canExpress(concept: RosettaConcept): boolean;
  
  // What makes this panel's expression distinctive?
  getDistinctiveFeature(concept: RosettaConcept): string;
  
  // Token cost estimate before full rendering
  estimateTokenCost(concept: RosettaConcept, depth: ExpressionDepth): number;
}

type ExpressionDepth = 'summary' | 'active' | 'deep';
```

### Panel Implementations

**Python Panel** — `pedagogicalFocus: "Readability and rapid prototyping. Python code reads almost like mathematical notation, making it the natural first panel for concept exploration."`

**C++ Panel** — `pedagogicalFocus: "Performance and precision. C++ forces you to think about types, memory, and hardware — revealing what the computer actually does with your math."`

**Java Panel** — `pedagogicalFocus: "Type safety and platform independence. Java's object model shows how mathematical concepts become reusable, portable software components."`

**Lisp Panel** — `pedagogicalFocus: "Code as data (homoiconicity). In Lisp, a concept definition IS a data structure you can inspect, transform, and compose. This is the Rosetta principle in its purest form."`

**Pascal Panel** — `pedagogicalFocus: "Structured thinking. Wirth designed Pascal to make the learner understand. Every construct has explicit boundaries. Every variable has a declared type. The discipline produces clarity."`

**Fortran Panel** — `pedagogicalFocus: "Scientific computing heritage. Fortran was designed for FORmula TRANslation — mathematical expressions in Fortran look almost exactly like their textbook form. It connects you to sixty years of computational science."`

## Verification Gate

- [ ] All 6 panels implement the Panel interface without type errors
- [ ] Each panel produces syntactically correct code for test concepts
- [ ] Pedagogical annotations are present and accurate for each panel
- [ ] Token cost estimates are within 20% of actual rendering cost
- [ ] Lisp panel demonstrates homoiconicity (concept IS a manipulable list)

---

# Calibration Engine — Component Specification

**Milestone:** Cooking with Claude
**Wave:** 1B (Track B)
**Model Assignment:** Opus (engine design), Sonnet (Safety Warden)
**Estimated Tokens:** ~30K combined
**Dependencies:** Wave 0 shared types
**Produces:** `calibration/engine.ts`, `calibration/models/cooking.ts`, `calibration/delta-store.ts`, Safety Warden framework

---

## Objective

Implement the universal Observe→Compare→Adjust→Record feedback loop that makes everything in the ecosystem improve over time. The Calibration Engine is parameterized by domain-specific science models — the same engine handles cooking temperature adjustments and code performance optimization, differing only in which science model provides the adjustment logic.

## Technical Specification

```typescript
class CalibrationEngine {
  private deltaStore: DeltaStore;
  private models: Map<string, CalibrationModel>;
  
  // The universal feedback loop
  async process(
    translationId: string,
    feedback: UserFeedback
  ): Promise<CalibrationDelta> {
    // 1. OBSERVE: Capture what happened
    const observed = this.observe(feedback);
    
    // 2. COMPARE: What was expected vs. what happened
    const delta = this.compare(observed, feedback.expectedOutcome);
    
    // 3. ADJUST: Apply domain science to compute correction
    const model = this.models.get(feedback.domain);
    const adjustment = model.computeAdjustment(delta);
    
    // 4. RECORD: Persist the calibration delta
    const record = { ...delta, adjustment, confidence: model.confidence(delta) };
    await this.deltaStore.save(record);
    
    // Enforce bounded learning constraint: max 20% parameter change
    return this.boundAdjustment(record);
  }
  
  // Accumulate: over time, build a calibration profile
  async getProfile(userId: string, domain: string): Promise<CalibrationProfile> {
    const deltas = await this.deltaStore.getHistory(userId, domain);
    return this.synthesizeProfile(deltas);
  }
}

// Domain-specific models implement this interface
interface CalibrationModel {
  domain: string;
  computeAdjustment(delta: ComparisonDelta): Record<string, number>;
  confidence(delta: ComparisonDelta): number;
  safetyBoundaries: SafetyBoundary[];
}
```

### Cooking Calibration Model

```typescript
const cookingModel: CalibrationModel = {
  domain: 'culinary',
  
  computeAdjustment(delta) {
    // Maps natural language feedback to parameter adjustments
    // using food science models
    const adjustments: Record<string, number> = {};
    
    if (delta.category === 'temperature') {
      // Newton's law of cooling: T(t) = T_ambient + (T_initial - T_ambient) · e^(-kt)
      // User says "overdone" → reduce temperature OR time
      adjustments.temperature = -25; // °F reduction
      adjustments.time = -0.15;      // 15% time reduction
    }
    
    if (delta.category === 'texture') {
      // Protein denaturation / starch gelatinization models
      // "too dry" → reduce heat, increase moisture, reduce time
      adjustments.temperature = -15;
      adjustments.time = -0.10;
      adjustments.liquid = 0.10; // 10% more liquid
    }
    
    return adjustments;
  },
  
  safetyBoundaries: [
    { parameter: 'poultry_internal_temp', limit: 165, type: 'absolute', 
      reason: 'FDA minimum safe internal temperature for poultry' },
    { parameter: 'ground_meat_internal_temp', limit: 160, type: 'absolute',
      reason: 'FDA minimum safe internal temperature for ground meats' },
    { parameter: 'danger_zone_time', limit: 120, type: 'absolute',
      reason: 'Maximum minutes food may remain in 40-140°F danger zone' }
  ]
};
```

### Safety Warden

Three enforcement modes, configurable per domain:

1. **Annotate** — Flag the safety concern but allow the user to proceed. Used for: nutritional advisories, technique suggestions, equipment recommendations.
2. **Gate** — Require explicit user acknowledgment before proceeding. Used for: allergen warnings, unusual ingredient combinations, high-temperature operations.
3. **Redirect** — Substitute a safe alternative without allowing the unsafe path. Used for: temperatures below safe minimums, storage times exceeding limits, cross-contamination risks.

## Verification Gate

- [ ] Calibration Engine completes full Observe→Compare→Adjust→Record cycle
- [ ] Cooking model produces correct adjustments for test scenarios
- [ ] Safety boundaries are NEVER violated regardless of calibration history
- [ ] 20% bounded learning constraint is enforced
- [ ] Delta store persists across sessions
- [ ] Safety Warden operates correctly in all three modes
