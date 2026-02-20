# LANG-101: Accessibility Audit

**Status**: Alpha (2026-02-20) | **Target**: WCAG 2.1 AA

## Summary

LANG-101 emphasizes sound systems, grammar patterns, and authentic communication. Key challenges: audio pronunciation guides need captions; script examples (non-Latin scripts) need Unicode support and visual accessibility; interactive speaking activities need alternatives for deaf/hard-of-hearing learners.

## Detailed Remediation Plan

### 1. Audio Pronunciation Guides
**Priority: HIGH** | **WCAG**: 1.2.2 (Captions), 1.2.3 (Audio Description)
- Provide captions for all pronunciation models
- Include IPA transcriptions with spelled-out pronunciations
- Offer visual mouth position diagrams with text descriptions

### 2. Script Accessibility (Non-Latin Scripts)
**Priority: HIGH** | **WCAG**: 1.3.1 (Info and Relationships), 1.4.3 (Contrast)
- Ensure non-Latin script rendering is robust across browsers
- Provide Roman transliteration alongside target script
- Test with screen readers for character-by-character reading

### 3. Interactive Speaking Activities
**Priority: MEDIUM** | **WCAG**: 2.1.1 (Keyboard), 1.2.1 (Audio-only)
- Provide text-based alternatives to speaking practice
- Record model pronunciations as downloadable audio
- Allow written responses with pronunciation feedback

### 4. Video Demonstrations
**Priority**: MEDIUM** | **WCAG**: 1.2.2 (Captions), 1.2.5 (Audio Description)
- Caption all video content at minimum
- Provide sign language interpretation for deaf learners
- Include audio descriptions of visual gestures/context

## WCAG Checklist
| Criterion | Status | Path |
|-----------|--------|------|
| 1.1.1 | Partial | Alt text for visual grammar examples |
| 1.2.2 | Partial | Captions for audio pronunciation |
| 1.3.1 | Partial | Semantic markup for language notation |
| 2.1.1 | Partial | Keyboard access to interactive pronunciation tools |
| 4.1.2 | Partial | ARIA labels for audio controls |

## Timeline
- **Phase 1**: Caption all pronunciation audio (2 months)
- **Phase 2**: Unicode testing and transliteration guides (2 months)
- **Phase 3**: Video captioning and sign language (ongoing)
