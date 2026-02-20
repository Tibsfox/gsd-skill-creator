# NUTR-101: Accessibility Audit

**Status**: Alpha (2026-02-20) | **Target**: WCAG 2.1 AA

## Summary

NUTR-101 integrates nutrition science with practical meal planning. Key accessibility challenge: food preparation activities need adaptive equipment guidance; discussions of food restrictions must not stigmatize; all content must respect diverse food needs and cultural practices.

## Key Issues & Remediation

### 1. Food Preparation Activities
**Priority: HIGH** | **WCAG**: 2.1.1 (Keyboard), 1.1.1 (Non-text Content)
- Document adaptive equipment options for various abilities
- Provide verbal recipe descriptions (not just visual)
- Include safety information for all preparation methods
- Offer non-cooking alternatives for learners with dietary restrictions

### 2. Nutrition Label Content
**Priority: MEDIUM** | **WCAG**: 1.3.1 (Info and Relationships), 1.4.3 (Contrast)
- Ensure label reading activities are accessible with screen readers
- Provide accessible nutrition data in structured tables
- Use clear, high-contrast label examples

### 3. Food Restriction Discussion
**Priority: HIGH** | **Ethical** - Beyond WCAG but critical
- Use respectful language ("I can't/I choose not to") not shame language
- Normalize dietary diversity
- Never visually distinguish restricted eaters; use inclusive language
- Provide resources for food-insecure families

### 4. Meal Planning Tools
**Priority: MEDIUM** | **WCAG**: 2.1.1 (Keyboard)
- Ensure digital meal planning tools are keyboard-accessible
- Provide text-based alternatives to visual meal boards
- Support cultural dietary practices in templates

## WCAG Checklist
| Criterion | Status | Path |
|-----------|--------|------|
| 1.1.1 | Partial | Alt text for nutrition labels, recipes |
| 1.3.1 | Partial | Semantic structure for data tables |
| 2.1.1 | Partial | Keyboard navigation for tools |
| 3.2.4 | N/A | Consistent navigation (not about nutrition) |
| 4.1.2 | Partial | ARIA labels for interactive planning |

## Timeline
- **Phase 1**: Food restriction inclusive language audit (1 month)
- **Phase 2**: Adaptive equipment documentation (1 month)
- **Phase 3**: Meal planning tool accessibility (2 months)
