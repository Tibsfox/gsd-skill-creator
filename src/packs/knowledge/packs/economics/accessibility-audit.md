# ECON-101: Accessibility Audit

**Status**: Alpha (2026-02-20) | **Target**: WCAG 2.1 AA

## Summary

ECON-101 teaches economic thinking through simulations, data analysis, and decision-making. Key accessibility challenges: financial charts need accessible alternatives; interactive simulations require keyboard navigation; economic privilege assumptions must be acknowledged.

## Key Issues & Remediation

### 1. Financial Charts & Data
**Priority: HIGH** | **WCAG**: 1.1.1 (Non-text Content), 1.4.11 (Contrast)
- Every graph must have accompanying data table
- Use colorblind-safe palettes for all visualizations
- Provide trend summaries: "Stock price increased 23% over 6 months"
- Test contrast with WCAG contrast checkers

### 2. Interactive Simulations
**Priority: HIGH** | **WCAG**: 2.1.1 (Keyboard), 4.1.2 (Name, Role, Value)
- Ensure marketplace simulations use keyboard navigation
- Label all interactive controls with ARIA labels
- Provide text-based market summary updates
- Make supply/demand adjustments fully keyboard-accessible

### 3. Calculator Tools
**Priority: MEDIUM** | **WCAG**: 2.1.1 (Keyboard)
- Ensure all financial calculators are keyboard-accessible
- Provide accessible calculation explanations
- Support Tab/Enter navigation
- Include clear result announcements

### 4. Socioeconomic Context
**Priority: MEDIUM** | **Ethical** - Beyond WCAG
- Acknowledge that financial planning requires sufficient income
- Provide resources for families with economic constraints
- Avoid assumptions about family financial situations
- Include perspectives on economic inequality

## WCAG Checklist
| Criterion | Status | Path |
|-----------|--------|------|
| 1.1.1 | Partial | Alt text/tables for all financial charts |
| 1.4.3 | Partial | Chart color contrast testing |
| 2.1.1 | Partial | Keyboard navigation for all interactive tools |
| 4.1.2 | Partial | ARIA labels for simulator controls |

## Timeline
- **Phase 1**: Financial chart audit and alternatives (1 month)
- **Phase 2**: Simulation keyboard accessibility (2 months)
- **Phase 3**: Socioeconomic context review (ongoing)
