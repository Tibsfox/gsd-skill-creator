# Vision Archetypes Reference

Classify the user's vision into one of these archetypes before writing any files. Classification determines the component shape, chipset patterns, wave structure, and failure modes to watch for.

---

## Archetype 1: Educational Pack

**Signals:** Curriculum, modules, learning progression, Try Sessions, cultural heritage content, practice exercises, skill ladders, "teach someone X"

**Characteristic components:**
- Foundation/overview module (Wave 0 alongside shared types)
- One component per curriculum module (parallelizable Wave 1)
- Safety Warden agent (mandatory — always on critical path)
- Assessment/validation system
- Integration: curriculum sequencing, module cross-references

**Chipset YAML pattern:**
```yaml
name: [pack-name]
version: 1.0.0
agents:
  topology: "leader-worker"
  agents:
    - name: "INSTRUCTOR"
      role: "curriculum delivery and adaptation"
    - name: "SAFETY-WARDEN"
      role: "boundary enforcement (annotate/gate/redirect)"
    - name: "ASSESSOR"
      role: "progress validation and feedback"
evaluation:
  gates:
    pre_deploy:
      - check: "safety_warden_present"
        action: "block"
      - check: "cultural_review_complete"
        action: "block"
```

**Mandatory:** Safety Warden is non-negotiable. Cultural heritage content requires OCAP®/IQ/CARE/UNDRIP alignment checks as mandatory-pass safety tests.

**Common failure modes:**
- Safety Warden omitted or put in a parallel wave (always serial, always final gate)
- Cultural content without nation-specific attribution (never "Indigenous peoples" generically)
- Modules that depend on reading each other (each must stand alone)
- Try Sessions without clear entry/exit conditions

**Through-line hook:** Educational packs connect to the "giddy smile a geeky kid gets when their mind is alive with creativity" — the north star of the GSD ecosystem.

---

## Archetype 2: Infrastructure Component

**Signals:** Filesystem contracts, message schemas, APIs, inter-service communication, plugin systems, technical specification, "the plumbing of GSD"

**Characteristic components:**
- Shared types / schema definitions (Wave 0 — always first)
- API surface definition
- Implementation components (parallelizable)
- Integration adapter
- Verification / health check

**Chipset YAML pattern:**
```yaml
name: [component-name]
version: 1.0.0
agents:
  topology: "pipeline"
  agents:
    - name: "SCHEMA"
      role: "type system and contract enforcement"
    - name: "BUILDER"
      role: "implementation"
    - name: "VERIFIER"
      role: "integration validation"
evaluation:
  gates:
    pre_deploy:
      - check: "type_check"
        command: "npx tsc --noEmit"
        action: "block"
      - check: "test_coverage"
        threshold: 80
        action: "block"
```

**Wave 0 is critical here.** All type definitions must be complete before any implementation wave begins — otherwise cache invalidation cascades through all parallel tracks.

**Common failure modes:**
- Shared types split across multiple components (consolidate into Wave 0)
- Interface contracts that change mid-mission (lock them in Wave 0)
- Missing the filesystem contract (output paths, naming conventions)
- No versioning strategy for schema evolution

**Through-line hook:** Infrastructure components are "invisible architecture" — the Amiga Principle in its purest form. The power is in what the implementation *doesn't* have to think about.

---

## Archetype 3: Organizational System

**Signals:** Roles, responsibilities, activation profiles, communication protocols, crew manifests, decision trees, "who does what when"

**Characteristic components:**
- Role definitions (Wave 0 alongside shared schemas)
- Activation profile mapping
- Communication loop architecture
- Go/No-Go gate specifications
- Human-in-the-loop (HITL) interface design

**Chipset YAML pattern:**
```yaml
name: [system-name]
version: 1.0.0
agents:
  topology: "router"
  agents:
    - name: "ORCHESTRATOR"
      role: "mission direction; go/no-go gates"
    - name: "CAPCOM"
      role: "human-machine interface (only channel crossing boundary)"
```

**Key constraint:** The CAPCOM agent is the *only* channel crossing the human-machine boundary. This is architectural, not stylistic.

**Common failure modes:**
- Multiple agents with direct human access (route everything through CAPCOM)
- Roles without clear authority boundaries (who has veto power?)
- Activation profiles that don't scale (Patrol → Squadron → Fleet must be smooth)
- Missing retrospective loop (how does the system learn from runs?)

**Through-line hook:** Organizational systems encode GSD's NASA SE methodology — mission control discipline applied to AI orchestration.

---

## Archetype 4: Creative Tool

**Signals:** UX, workflow emphasis, rendering pipeline, output formats, creative expression, hardware integration (audio, MIDI, video), "what the user *makes* with this"

**Characteristic components:**
- UX/interaction model prototype (Wave 0 — validate before building)
- Input handling pipeline
- Processing/transformation core
- Rendering/output system
- Preview/feedback loop
- Export/integration connectors

**Chipset YAML pattern:**
```yaml
name: [tool-name]
version: 1.0.0
agents:
  topology: "pipeline"
  agents:
    - name: "INPUT-HANDLER"
      role: "capture and normalize user input"
    - name: "TRANSFORMER"
      role: "apply creative processing"
    - name: "RENDERER"
      role: "output generation and preview"
evaluation:
  gates:
    pre_deploy:
      - check: "user_flow_complete"
        action: "block"
      - check: "output_format_valid"
        action: "block"
```

**UX-first principle:** The interaction model must be validated before building the pipeline. An elegant interaction that wraps a mediocre pipeline is better than a powerful pipeline with a confusing interface.

**Common failure modes:**
- Building the processing core before the UX is settled (waterfall trap)
- Output formats that don't match real-world tools (always validate against actual file format specs)
- Missing the "creative surprise" — the moment that produces the giddy smile
- No undo/versioning strategy for creative work

**Through-line hook:** Creative tools are GSD's soul. They exist to give people their lives back so humans can focus on art, music, and being human.

---

## Archetype 5: Agent / Skill Pack

**Signals:** Agents, skills, skill-creator integration, SKILL.md files, chipset configuration, "teach GSD to do X", agent topologies, skill activation

**Characteristic components:**
- Chipset YAML specification (Wave 0)
- SKILL.md templates per skill
- Agent role definitions
- Trigger/activation configuration
- Evaluation/benchmark harness
- Integration with gsd-skill-creator

**Chipset YAML pattern:**
```yaml
name: [pack-name]
version: 1.0.0
skills:
  [skill-a]:
    domain: [domain-id]
    description: "[when to trigger + what it does]"
    triggers:
      - "[user phrase pattern]"
  [skill-b]:
    domain: [domain-id]
    description: "[when to trigger + what it does]"
agents:
  topology: "[depends on skill relationships]"
evaluation:
  benchmark:
    trigger_accuracy_threshold: 0.85
    test_cases_minimum: 20
```

**Trigger description quality matters most.** The skill description is the primary activation mechanism — it must be specific enough to trigger reliably and scoped enough not to over-trigger. Apply the "slightly pushy" principle from the skill-creator skill.

**Common failure modes:**
- Generic skill descriptions that over-trigger or under-trigger
- Skills without evaluation harnesses (unverifiable quality)
- Agent topologies that don't match actual data flow
- Missing bounded-learning constraints (for self-modifying skills: 20% max change per update, 3-correction minimum before promotion, 7-day cooldown)

**Through-line hook:** Agent/skill packs are the Rosetta Stone of the GSD ecosystem — the living translation engine that makes capability composable.

---

## Cross-Archetype Patterns

Some visions span multiple archetypes. Handle as follows:

| Combination | Approach |
|-------------|----------|
| Educational + Agent/Skill | Educational is the primary; agents serve pedagogy |
| Infrastructure + Org System | Org system defines the roles; infrastructure implements their contracts |
| Creative Tool + Agent/Skill | Agents are the creative engine; tool is the UX wrapper |
| Any + Cultural Heritage | Cultural sovereignty constraints apply to *all* components, not just "the heritage section" |
