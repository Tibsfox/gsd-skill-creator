# PSYCH-101: Accessibility Audit

**Status**: Alpha (2026-02-20) | **Target**: WCAG 2.1 AA

## Summary

PSYCH-101 explores human behavior, development, and emotion. Key accessibility challenges: content sensitivity flags for mental health topics; video demonstrations of psychological phenomena; emotion recognition activities may rely on visual or facial cues.

## Key Issues & Remediation

### 1. Mental Health Content Warnings
**Priority: HIGH** | **WCAG**: 1.3.1 (Info and Relationships)
- Provide clear content warnings at start of sensitive modules
- Offer alternatives for learners with trauma histories
- Include mental health resources (Crisis Text Line, NAMI)
- Text warnings must appear before audio/video

### 2. Emotion Recognition Activities
**Priority: HIGH** | **WCAG**: 1.1.1 (Non-text Content)
- Provide text descriptions of emotional expressions
- Use multiple emotion indicators (not facial expressions only)
- Offer context-based emotion inference (scenario descriptions)

### 3. Video Demonstrations
**Priority: MEDIUM** | **WCAG**: 1.2.2 (Captions)
- Caption all videos demonstrating behavior/development
- Describe relevant non-verbal cues in captions
- Include transcript for audio-only access

### 4. Discussion & Reflection Activities
**Priority: LOW** | **WCAG**: 2.1.1 (Keyboard)
- Ensure all discussion platforms are keyboard-accessible
- Allow written, audio, or visual response options
- Provide structured reflection templates

## WCAG Checklist
| Criterion | Status | Path |
|-----------|--------|------|
| 1.1.1 | Partial | Alt text for emotion/facial cues |
| 1.2.2 | Partial | Captions for video demonstrations |
| 1.3.1 | Partial | Content warning structure markup |
| 2.1.1 | Partial | Keyboard navigation for discussions |
| 4.1.2 | Partial | ARIA labels for interactive activities |

## Timeline
- **Phase 1**: Content warning system (1 month)
- **Phase 2**: Video captioning (2 months)
- **Phase 3**: Activity alternatives (3 months)
- **Phase 4**: Platform accessibility audit (ongoing)
