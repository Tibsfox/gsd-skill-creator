# Bibliography

## Primary Text

**Horowitz, Paul and Winfield Hill. *The Art of Electronics.* 3rd ed. Cambridge University Press, 2015.**

- ISBN: 978-0-521-80926-9
- Pages: 1220
- Abbreviation used throughout: **H&H**

### Citation Convention

References follow the pattern: **H&H [section]** or **H&H Ch.[chapter]**

Examples:
- H&H 1.2 -- Voltage dividers (Chapter 1, Section 2)
- H&H Ch.4 -- Operational Amplifiers (full chapter)
- H&H 10.1-10.2 -- Combinational logic (sections 1-2 of Chapter 10)

### Programmatic Citation Keys

In addition to the inline convention, content uses `[@key]` syntax for programmatic citation lookup:

- `[@HH-1.2]` -- Voltage dividers (resolves via HH_CHAPTER_MAP in learn-mode.ts)
- `[@HH-1.3]` -- Signals (sine, square, triangle waveforms, RMS, crest factor)
- `[@HH-1.5]` -- Inductors and transformers (RL time constant, turns ratio)
- `[@HH-Ch.4]` -- Operational amplifiers

The `[@key]` format complements `-- H&H X.Y` for machine-readable cross-referencing. Both formats can coexist in the same learn_note string.

### Section Numbering

H&H uses hierarchical numbering: Chapter.Section (e.g., 1.2, 9.8).
Full chapter references use "Ch." prefix (e.g., Ch.2, Ch.13).

## Supplementary References

- IEC 61131-3: Programmable controllers -- Programming languages (Module 13)
- NEC (National Electrical Code): Electrical installation standards (Module 14)

## Pack Cross-References

This pack connects to:
- AGC Pack: Transistor-level computer architecture (Module 5, 7A connections)
- Math Pack: Complex numbers for AC analysis (Module 3), Fourier transforms (Module 10)
