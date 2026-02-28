# ENVR-101: Accessibility Audit

**Status**: Alpha (2026-02-20) | **Target**: WCAG 2.1 AA

## Summary

ENVR-101 emphasizes fieldwork and observation. Key accessibility challenge: field activities may exclude mobility-limited learners; climate data visualizations need text alternatives; data tables must be accessible.

## Key Issues & Remediation

### 1. Field Activities
**Priority: HIGH** | **WCAG**: 2.1.1 (Keyboard), 1.1.1 (Non-text Content)
- Provide indoor/virtual alternatives to outdoor observation
- Create "field observation guide" with detailed descriptions
- Use citizen science platforms with accessibility options (iNaturalist)
- Document adaptations for various mobility levels

### 2. Data Visualizations
**Priority: HIGH** | **WCAG**: 1.1.1 (Non-text Content), 1.4.11 (Contrast)
- Every chart must have accompanying data table
- Use colorblind-safe palettes for climate graphics
- Provide trend descriptions: "global temperatures rising 0.13°C/decade"

### 3. Models & Simulations
**Priority: MEDIUM** | **WCAG**: 2.1.1 (Keyboard)
- Ensure earth systems models have keyboard navigation
- Provide text-based parameter descriptions
- Include "reset to default" buttons for usability

### 4. Resources & Documentation
**Priority: LOW** | **WCAG**: 1.1.1 (Non-text Content)
- Provide transcripts for video content
- Add captions to environmental process demonstrations
- Include text descriptions of satellite imagery

## WCAG Checklist
| Criterion | Status | Path |
|-----------|--------|------|
| 1.1.1 | Partial | Alt text/tables for all visualizations |
| 1.3.1 | Partial | Data table semantic structure |
| 1.4.3 | Partial | Chart color contrast testing |
| 2.1.1 | Partial | Keyboard navigation for interactive models |
| 2.4.2 | Partial | Page titles for field activity guides |

## Timeline
- **Phase 1**: Data table and visualization audit (2 months)
- **Phase 2**: Field activity adaptations (2 months)
- **Phase 3**: Interactive model accessibility (3 months)
