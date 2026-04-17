# Retrospective — v1.49.111

## What Worked

- The three-track parallel structure (API+Framework, Extensions, Performance) mirrors how GPU developers actually approach Vulkan -- learn the core API, understand extensions, optimize
- Extension promotion path tracking (vendor to EXT to KHR) is genuinely useful intelligence -- it tells agents which extensions are stable, which are experimental, and which are being deprecated
- Mapping every sample as a DACP bundle creates a queryable corpus rather than a passive document

## What Could Be Better

- Mobile Vulkan (Android, embedded ARM) gets framework treatment but deserves dedicated performance profiling for mobile GPU architectures (tile-based rendering)
- The ray tracing extension ecosystem is evolving fast enough that version tracking will need quarterly refresh

## Lessons Learned

- The spaces between samples -- the connections between "dynamic rendering" and "render passes," between "mesh shaders" and the migration from geometry shaders -- are where the real knowledge lives; mapping those connections is the deliverable
- Extension promotion paths encode the politics of GPU standardization: vendor extensions signal R&D direction, EXT extensions signal multi-vendor agreement, KHR extensions signal ecosystem consensus
- 80+ DACP bundles is the threshold where the wiring module becomes more valuable than any individual sample module -- the index is the product

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
