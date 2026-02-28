# LOG-101: Accessibility Audit

**Status**: Alpha (2026-02-20) | **Target**: WCAG 2.1 AA

## Summary

LOG-101 introduces logical reasoning from concrete thinking to formal systems. Key accessibility challenges: symbolic logic notation needs screen reader support (MathML); truth tables must be structured as data tables; logic games and interactive tools need text-based alternatives.

## Key Issues & Remediation

### 1. Symbolic Logic Notation
**Priority: HIGH** | **WCAG**: 1.1.1 (Non-text Content), 1.3.1 (Info and Relationships)
- Use MathML for all logical symbols (∧, ∨, ¬, →, ↔)
- Provide spell-out: `<math><mi>p</mi><mo>∧</mo><mi>q</mi></math>` = "p AND q"
- Include text alternatives alongside symbolic notation
- Test screen reader support for logical operators

### 2. Truth Tables
**Priority: HIGH** | **WCAG**: 1.3.1 (Info and Relationships)
- Structure all truth tables as semantic HTML `<table>` with `<th>` headers
- Ensure column headers identify variables clearly
- Provide row-by-row text descriptions of truth value assignments
- Use consistent formatting and labeling across all examples

### 3. Logic Puzzles & Games
**Priority: MEDIUM** | **WCAG**: 2.1.1 (Keyboard), 1.1.1 (Non-text Content)
- Provide text-based logic puzzle descriptions
- Ensure interactive logic tools are fully keyboard-accessible
- Create "logic transcript" that can be read/solved without visuals
- Include alternative puzzle formats (verbal descriptions, constraint lists)

### 4. Fallacy Examples
**Priority: MEDIUM** | **WCAG**: 1.1.1 (Non-text Content)
- Provide text-based fallacy examples alongside visual ones
- Describe argument structure clearly: "premise 1... premise 2... conclusion..."
- Use consistent formatting for logical structure
- Include explicit reasoning markers ("therefore", "because", "however")

## WCAG Checklist
| Criterion | Status | Path |
|-----------|--------|------|
| 1.1.1 | Partial | MathML for logic notation |
| 1.3.1 | Partial | Truth table semantic HTML |
| 2.1.1 | Partial | Keyboard navigation for interactive tools |
| 4.1.2 | Partial | ARIA labels for logic game controls |

## Timeline
- **Phase 1**: MathML implementation for notation (2 months)
- **Phase 2**: Truth table conversion to semantic HTML (1 month)
- **Phase 3**: Logic game keyboard accessibility testing (2 months)
