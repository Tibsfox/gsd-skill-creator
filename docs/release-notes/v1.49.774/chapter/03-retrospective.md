# Retrospective — v1.49.774

## What Worked

- **Eighth Path A fresh-build completed via salvage.** Pattern: sub-agent dispatched + tripped + main-context salvage repaired + gates clean + ship completed. Same pattern as v1.49.772 Geotail salvage.
- **Sub-agent wrote 14 files + 2 artifacts cleanly** before token-repetition collapse in dedication.
- **Token-repetition-collapse detection + cleanup tractable in main-context** — one Edit call replaced the collapsed paragraph; sidebar block + bottom nav-card added in subsequent Edits.

## What Could Be Better

- **Two consecutive sub-agent trips in this autonomous run** (v772 + v774). Trip mechanism is now characterized: substrate-vocabulary token-repetition collapse in dedication paragraph during long prose generation. Forward-preventive: future dispatch prompts should (a) cap dedication paragraph word count, (b) explicitly forbid substrate-vocabulary repetition in dedication, or (c) author dedication in main-context rather than sub-agent.
- **API error analysis added to handoff** for forward-preventive reference.

## Decisions

- **IMAGE chosen as next candidate** after Polar v1.175. Strongest remote-sensing-substrate-form-distinct continuation.
- **No substrate-axis rotation at v774.**
- **Great Horned Owl + Vine Maple pairing.** Global single-viewpoint vision + multi-stem broad-canopy mirrors to IMAGE global magnetosphere imaging + 6-channel multi-spectral coverage.
- **Salvage pattern applied** rather than substituting next candidate.

## Surprises

- **Token-repetition collapse is the actual trip mechanism, not vocabulary classes.** The substrate-vocab regex audit was clean for both v772 + v774, but sub-agent dedication-paragraph generation drifted into repetitive output. The filter detects output-quality degradation independently of pre-generation vocabulary classes.

## Lessons Learned

- **Substrate-vocabulary token-repetition collapse in long sub-agent prose is a distinct trip class.** Future dispatch prompts should explicitly require dedication paragraph to be ≤200 words AND forbid the word "substrate" appearing more than 5 times in any single paragraph.
- **Main-context salvage for sidebar + dedication + nav-card is ~5 Edits.** Cost is bounded; pattern is reliable.
- **8 consecutive fresh-builds + 2 salvages = 10/10 successful ships in this run.** Path A pattern with salvage is robust at this scale.
