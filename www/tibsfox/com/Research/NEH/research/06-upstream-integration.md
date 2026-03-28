# Upstream Intelligence Integration

## Purpose

This module produces the artifact that makes all other modules useful inside skill-creator: the intelligence index that agents can query, the DACP bundle schemas for graphics skill handoffs, and the deprecation map that flags legacy patterns.

## Intelligence Index Architecture

The intelligence index is a structured, queryable reference that maps:

- **Concept to lesson:** "What lesson covers particle systems?" -> L19
- **Lesson to prerequisites:** "What must I know before L27?" -> L05, L07, L26
- **API function to lesson:** "Which lesson uses glStencilOp?" -> L26, L27
- **Tier to lesson set:** "What are the foundation lessons?" -> L01-L12

### Query Interface

```yaml
query_types:
  concept_lookup:
    input: concept_name (string)
    output: lesson_ids[], tier, prerequisites[]
  
  lesson_detail:
    input: lesson_id (L01-L48)
    output: title, tier, concepts[], prerequisites[], modernization_notes
  
  api_lookup:
    input: gl_function_name (string)
    output: lesson_ids[], deprecation_status, modern_equivalent
  
  tier_listing:
    input: tier (0-4)
    output: lesson_ids[], concepts[], total_prerequisites
```

## DACP Bundle Schema for Graphics

Each lesson maps to a DACP-compatible three-part bundle:

### Bundle Structure

```yaml
dacp_bundle:
  part_1_human_intent:
    description: "What the developer wants to achieve"
    example: "I want to add shadow volumes to my scene"
  
  part_2_lesson_reference:
    lesson_id: "L27"
    title: "Shadow Volumes"
    tier: 3
    prerequisites: [L05, L07, L26]
    concepts: [stencil_buffer, silhouette_edges, shadow_geometry]
    modernization_status: "partially_deprecated"
    modern_notes: "Stencil shadow volumes still valid; shader-based shadow maps preferred for performance"
  
  part_3_executable_code:
    language: "python"
    framework: "pyopengl+glfw"
    file: "lessons/advanced/l27_shadow_volumes.py"
    test: "tests/test_l27.py"
    dependencies: [PyOpenGL, glfw, numpy]
```

## Deprecation Map

### Legacy Pattern Categories

| Category | Count | Severity |
|----------|-------|----------|
| Immediate mode (glBegin/glEnd) | 36 lessons | High -- functionally removed in GL 3.3+ core profile |
| Fixed-function lighting | 12 lessons | High -- replaced by shader-based lighting |
| Display lists | 1 lesson | Medium -- replaced by VBOs |
| glDrawPixels | 1 lesson | Medium -- replaced by FBO + texture |
| GL_SELECT picking | 1 lesson | Medium -- replaced by ray casting or color ID |
| GLU functions | 3 lessons | Low -- GLU still available but not core |
| wglUseFontBitmaps | 2 lessons | High -- Windows-only, deprecated |
| Cg shaders | 1 lesson | High -- NVIDIA discontinued Cg; use GLSL |

### Migration Paths

Each deprecated pattern has a documented migration path:

```
DEPRECATED: glBegin(GL_TRIANGLES) ... glEnd()
MODERN: 
  1. Create VBO with glGenBuffers/glBufferData
  2. Create VAO with glGenVertexArrays/glVertexAttribPointer
  3. Create vertex shader (GLSL)
  4. Create fragment shader (GLSL)
  5. Render with glDrawArrays or glDrawElements
AFFECTED: L02-L36 (virtually all pre-VBO lessons)
REFERENCE: L45 (VBO lesson) provides the bridge pattern
```

## Documentation Index

The documentation index enables full-text search across all lesson descriptions, modernization notes, and concept definitions. It is implemented as a JSON file with inverted index structure:

```json
{
  "stencil": {"lessons": ["L26", "L27"], "concepts": ["stencil_buffer", "shadow_volumes"]},
  "texture": {"lessons": ["L06", "L07", "L08", "L15", "L22", "L23", "L24", "L33", "L38"]},
  "physics": {"lessons": ["L19", "L39", "L40", "L41"]},
  "font": {"lessons": ["L13", "L14", "L15", "L17", "L43"]},
  "shader": {"lessons": ["L37", "L47"], "concepts": ["cel_shading", "cg_vertex_program"]}
}
```

## Skill Registration

The NeHe corpus registers with skill-creator as a skill type:

```yaml
skill_type: opengl-lesson
version: 1.0
corpus_size: 48
tiers: [foundation, texture_light, intermediate, advanced, expert]
query_capability: [concept, lesson, api_function, tier]
bundle_format: dacp_v1
deprecation_awareness: true
modernization_target: "OpenGL 3.3+ core profile with GLFW + Python"
```

When a skill-creator agent encounters a graphics-related request, the opengl-lesson skill type provides:

1. Concept identification -- what graphics concept is the request about?
2. Tier assessment -- what level of complexity is needed?
3. Lesson retrieval -- which specific lesson(s) address this?
4. Code delivery -- working Python implementation
5. Deprecation warning -- if the pattern is legacy, suggest modern alternative

---

> **Related:** See [Taxonomy](01-taxonomy-skill-mapping.md) for the knowledge graph this module indexes, and [Expert Track](05-expert-track.md) for the most complex lessons in the corpus.
