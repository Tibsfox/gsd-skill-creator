# skill-creator Wiring

## Purpose

This module produces the integration artifacts that make the Vulkan corpus queryable by skill-creator agents: 80+ DACP bundles, a version gate skill, and a ZFC stamp candidate for federation compliance.

## DACP Bundle Architecture

Each Vulkan sample maps to a DACP-compatible three-part bundle:

### Bundle Structure

```yaml
dacp_bundle:
  part_1_human_intent:
    description: "What the developer wants to achieve"
    keywords: [searchable, terms]
    complexity: "foundation|intermediate|advanced|expert"
    
  part_2_sample_reference:
    sample_id: "hello_triangle"
    category: "api"
    vulkan_min: "1.0"
    extensions_required: []
    concepts: [instance, device, swapchain]
    source_url: "https://github.com/KhronosGroup/Vulkan-Samples/tree/main/samples/api/hello_triangle"
    documentation: "https://docs.vulkan.org/samples/latest/samples/api/hello_triangle.html"
    
  part_3_executable:
    framework_path: "samples/api/hello_triangle/"
    build_target: "hello_triangle"
    runtime_requirements:
      gpu: "any_vulkan"
      vulkan: "1.0"
      extensions: []
```

### Bundle Categories

| Category | Count | Complexity Range |
|----------|-------|-----------------|
| API Foundations | 14 | Foundation |
| API Hpp Variants | 14 | Foundation |
| Extension Samples | 47 | Intermediate-Expert |
| Performance Patterns | 24 | Advanced-Expert |

## Version Gate Skill

The version gate skill checks hardware and driver capability before recommending samples:

### Decision Logic

```
INPUT: developer request + target hardware description

1. Parse request for Vulkan concepts/extensions
2. Look up required Vulkan version and extensions
3. Check against target hardware capabilities:
   - If supported: return sample bundle
   - If partially supported: return bundle + migration notes
   - If unsupported: return alternative approach or error

OUTPUT: appropriate DACP bundle(s) with compatibility notes
```

### Hardware Tier Classification

| Tier | Description | Vulkan Version | Example GPUs |
|------|------------|---------------|-------------|
| Tier 0 | Basic Vulkan | 1.0-1.1 | Older integrated GPUs |
| Tier 1 | Modern baseline | 1.2 | GTX 1000, RX 5000, Mali G76 |
| Tier 2 | Full featured | 1.3 | RTX 3000, RX 6000, Mali G710 |
| Tier 3 | Ray tracing | 1.3 + RT | RTX 2000+, RX 6000+ |
| Tier 4 | Mesh + RT | 1.3 + mesh + RT | RTX 3000+, RX 7000+ |
| Tier 5 | Tensor/ML | 1.3 + tensor | Mali G720+, future GPUs |

## ZFC Stamp Candidate

The Zero-Fiction Compliance (ZFC) stamp validates that the Vulkan intelligence corpus meets federation standards:

### Compliance Criteria

| Criterion | Requirement | Status |
|-----------|------------|--------|
| Source attribution | Every sample traced to official Khronos repository | Verified |
| Version accuracy | All version requirements match Vulkan specification | Verified |
| Extension status | Promotion paths current as of SDK 1.4.341 | Verified |
| No speculative claims | All capabilities documented, not assumed | Verified |
| Reproducibility | All samples buildable from published source | Build-tested |

### Stamp Format

```yaml
zfc_stamp:
  corpus: "vulkan-desktop"
  version: "1.0"
  samples_count: 80
  dacp_bundles: 80
  vulkan_spec_version: "1.4"
  sdk_version: "1.4.341"
  last_verified: "2026-03-27"
  compliance_level: "full"
```

## Agent Query Patterns

### Common Queries

| Query | Resolution Path |
|-------|----------------|
| "How do I draw a triangle in Vulkan?" | Concept lookup -> hello_triangle bundle |
| "How to do ray tracing?" | Extension lookup -> ray_tracing_basic bundle + hardware tier check |
| "Optimize my render pass" | Performance category -> render pass best practices bundle |
| "What extensions does RTX 3080 support?" | Hardware tier -> Tier 4 capability list |
| "Is VK_EXT_mesh_shader core yet?" | Upstream intelligence -> promotion tracking |

### Query Processing Pipeline

```
Agent receives graphics request
  |
  v
Concept extraction (identify Vulkan terms)
  |
  v
Version gate check (hardware capability)
  |
  v
Bundle retrieval (DACP three-part)
  |
  v
Deprecation check (upstream intelligence)
  |
  v
Response assembly (bundle + context + warnings)
```

## Integration with skill-creator Loop

The Vulkan corpus integrates with skill-creator's six-step loop:

1. **Observe** -- detect graphics-related concepts in agent requests
2. **Detect** -- identify specific Vulkan patterns, extensions, or techniques
3. **Suggest** -- recommend appropriate sample bundles based on complexity and hardware
4. **Manage** -- track which bundles have been delivered, avoid redundancy
5. **Auto-load** -- preload related bundles when a pattern family is detected
6. **Learn** -- record which bundles were useful, which needed modification

---

> **Related:** See [Upstream Intelligence](05-upstream-intelligence.md) for the version tracking that feeds the version gate, and [API Foundations](01-api-foundations.md) for the core samples these bundles reference.
