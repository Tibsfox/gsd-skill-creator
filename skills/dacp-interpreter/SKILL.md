# DACP Interpreter

> Load, validate, and use DACP bundles as structured execution context.
> Scripts are NEVER auto-executed -- always review before deciding to use.

## Summary (~3K tokens -- always loaded)

The DACP Interpreter handles receiving-side bundle processing. When a `.bundle/`
directory appears alongside a `.msg` file, the interpreter:

1. **Detects** the `.bundle/` companion directory
2. **Validates** bundle integrity (manifest schema, fidelity match, file existence, size limits, provenance)
3. **Loads** the bundle into a typed `LoadedBundle` with parsed data, schemas, and script metadata
4. **Integrates** by building a structured `ExecutionContext` for the receiving agent

### Safety Invariant (SAFE-01)

Scripts in bundles are **review-only references**. They are presented as plain text strings
for the agent to read and decide whether to use. The interpreter NEVER auto-executes any script.

### Fidelity Level Guide

| Level | Contents | What to Do |
|-------|----------|------------|
| 0 | Intent markdown only | Read intent.md, proceed with instructions |
| 1 | Intent + structured data | Access `typedData` for structured parameters |
| 2 | Intent + data + schemas | Validate your understanding against schemas |
| 3 | Intent + data + code | Review scripts, decide whether to execute or reference |
| 4 | Intent + data + code + tests | Verify with provided test fixtures before proceeding |

### Interpretation Pipeline

```
DETECT -> VALIDATE -> LOAD -> INTEGRATE
  |          |         |         |
  |          |         |         +-- buildExecutionContext()
  |          |         +-- loadBundle()
  |          +-- validateBundle()
  +-- Check for .bundle/ directory
```

## Active (~12K tokens -- loaded on .bundle/ detection)

### Step-by-Step Interpretation

1. **Check for bundle companion.** Look for a `.bundle/` directory alongside the `.msg` file.
   If found, prefer the bundle over raw `.msg` content.

2. **Run validation pipeline.** Call `validateBundle(bundlePath)` to check:
   - `.complete` marker exists (atomicity guarantee)
   - `manifest.json` parses and validates against Zod schema
   - Fidelity level matches actual directory contents
   - All referenced data and code files exist on disk
   - Size limits respected (50KB data, 10KB per script, 100KB total)
   - Data payloads validate against referenced JSON schemas
   - All scripts have provenance (source skill attribution)

3. **Load bundle.** Call `loadBundle(bundlePath)` to get a typed `LoadedBundle` with:
   - Parsed manifest object
   - Raw intent markdown
   - JSON data payloads as typed objects
   - Schema definitions
   - Script content loaded for review

4. **Build execution context.** Call `buildExecutionContext(loadedBundle)` to get:
   - `intentSummary` -- what the sender wants done
   - `intentMarkdown` -- full instructions
   - `typedData` -- structured parameters you can use directly
   - `scriptReferences` -- scripts to review (NOT execute blindly)
   - `assemblyRationale` -- why the bundle was composed this way

5. **Review scripts before use.** For each script in `scriptReferences`:
   - Read the script content
   - Understand what it does
   - Decide: execute it, reference its logic, or skip it
   - NEVER execute without reviewing first

6. **Report outcome.** After completing the work, report the handoff outcome
   (intent alignment, rework needed, verification status) for drift tracking.

### Handling Invalid Bundles

If `validateBundle()` returns `valid: false`:
- Check if a `.msg` fallback file exists alongside the bundle
- If yes: fall back to `.msg` content (backward compatibility)
- If no: report the validation errors and request a re-send

### Provenance Enforcement

Scripts without a valid `source_skill` in the manifest are rejected. This ensures
every executable artifact traces back to a known, versioned skill. If provenance
validation fails:
- Do NOT use the script
- Report which scripts failed provenance
- Request a corrected bundle from the sender

## References

- `src/interpreter/validator.ts` -- bundle validation pipeline
- `src/interpreter/loader.ts` -- bundle loading into typed structures
- `src/interpreter/context-builder.ts` -- execution context assembly
- `src/interpreter/provenance-guard.ts` -- deep provenance validation
- `src/interpreter/types.ts` -- type definitions (LoadedBundle, ExecutionContext, etc.)
- `src/dacp/types.ts` -- DACP type system (BundleManifest, FidelityLevel, etc.)
