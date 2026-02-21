# CODE-101: Accessibility Audit

**Status**: Alpha (2026-02-20)
**Target Compliance**: WCAG 2.1 AA

## Executive Summary

CODE-101 introduces computational thinking and programming across K-12. Key accessibility challenge: code editors and visual programming environments vary widely in accessibility. The pack itself can be delivered accessibly, but tools require careful selection and configuration.

## Detailed Audit

### 1. Code Editors & Syntax Highlighting

**Current Status**: Partially Accessible
**WCAG Criterion**: 1.3.1 Info and Relationships (Level A), 1.4.11 Non-text Contrast (Level AA)

**Issues Found**:
- Default syntax highlighting may not provide sufficient contrast
- Screen reader users cannot perceive color-only code distinction
- Some visual programming environments (Scratch) have known accessibility gaps

**Remediation Path** (Priority: HIGH):
1. **For block-based environments (Scratch, Blockly)**:
   - Use environments with ARIA labels on blocks
   - Ensure keyboard navigation between blocks
   - Test with JAWS, NVDA for block structure announcement
   - Alternative: Provide text-based pseudocode alongside blocks

2. **For text-based code (Python, JavaScript)**:
   - Use syntax-highlighting schemes with high contrast (WCAG AA minimum)
   - Ensure color is never the only means of conveying syntax
   - Provide semantic markup: `<code>`, `<pre>` with proper nesting
   - Supply additional context through comments for visual-only markers

3. **Immediate actions**:
   - Document recommended accessible editor configurations (VS Code with accessibility extensions)
   - Provide keyboard shortcuts guide for all visual environments
   - Create text-based code examples with annotations

### 2. Code Output & Terminal Display

**Current Status**: Needs Improvement
**WCAG Criterion**: 1.1.1 Non-text Content (Level A), 4.1.2 Name, Role, Value (Level A)

**Issues Found**:
- Terminal/console output may be hard to navigate for screen reader users
- Error messages sometimes visual-only (red text, icons)
- Program state (variable values, execution flow) not announced

**Remediation Path** (Priority: HIGH):
1. Ensure console output includes text descriptions of errors and warnings
2. Use semantic logging: "ERROR: Division by zero at line 5" not just red icon
3. Provide visual-to-text mapping for error severity levels
4. Test with: screen readers reading entire output sequentially

### 3. Visual Debugging Tools

**Current Status**: Low Accessibility
**WCAG Criterion**: 1.1.1 Non-text Content, 2.1.1 Keyboard (Level A)

**Issues Found**:
- Debuggers (step-through, variable inspector) are primarily visual
- Breakpoint placement requires mouse dragging
- Call stacks and variable watches difficult to read with zoom

**Remediation Path** (Priority: MEDIUM):
1. Provide text-based debugging output (e.g., `gdb` command-line interface)
2. Make breakpoint/step operations keyboard-accessible
3. Offer variable watch in text format alongside visual representation
4. Create "debugging narration" guides: "At breakpoint line 10, variable x = 5, y = undefined"

### 4. Interactive Elements (Scratch, Blockly, Game Engines)

**Current Status**: Partial, Varies by Tool
**WCAG Criterion**: 2.1.1 Keyboard, 2.4.7 Focus Visible (Level AA)

**Issues Found**:
- Drag-and-drop block manipulation not keyboard-accessible in all environments
- Focus indicators may be missing or low-contrast
- Some games/interactive simulations require mouse precision

**Remediation Path** (Priority: MEDIUM):
1. Select tools with documented keyboard support (check tool accessibility docs)
2. Provide alternatives: text-based command entry for block-based environments
3. Ensure focus indicators meet WCAG AA (3:1 contrast minimum)
4. For game projects: include difficulty settings and alternative control schemes

### 5. Project Assessment & Sharing

**Current Status**: Needs Improvement
**WCAG Criterion**: 1.1.1 Non-text Content, 1.4 Distinguishable (Level A/AA)

**Issues Found**:
- Portfolio projects often shared as screenshots or visual recordings
- Peer review comments may rely on pointing to visual elements
- Assessment rubrics may emphasize aesthetic visual design

**Remediation Path** (Priority: MEDIUM):
1. Always include source code in plain text alongside any visual project demo
2. Encourage text-based project documentation explaining code choices
3. Peer feedback: "Your loop at lines 8-12 efficiently handles..." (text, not visual pointing)
4. Assessment: evaluate code correctness, problem-solving, and clarity — not visual polish

### 6. Resources & Documentation

**Current Status**: Generally Accessible
**WCAG Criterion**: 1.1.1 Non-text Content, 1.3.1 Info and Relationships

**Issues Found**:
- Algorithm visualizations (sorting, searching) may be visual-only
- Some concept videos lack captions

**Remediation Path** (Priority: LOW):
1. Provide text descriptions of algorithm visualizations
2. Offer step-by-step written algorithm explanations alongside visual demos
3. Add captions to any video demonstrations
4. Include pseudocode and text explanations for all visual content

## WCAG 2.1 AA Compliance Checklist

| Criterion | Current | Target | Status | Notes |
|-----------|---------|--------|--------|-------|
| 1.1.1 Non-text Content | Partial | Pass | In Progress | Code examples need alt text / text alternatives |
| 1.3.1 Info and Relationships | Partial | Pass | In Progress | Block relationships need ARIA labels |
| 1.4.3 Contrast (Minimum) | Partial | Pass | In Progress | Syntax highlighting config needed |
| 1.4.11 Non-text Contrast | Partial | Pass | In Progress | UI elements need testing |
| 2.1.1 Keyboard | Partial | Pass | In Progress | Tool selection critical |
| 2.1.2 No Keyboard Trap | Pass | Pass | Complete | Environments tested |
| 2.4.7 Focus Visible | Partial | Pass | In Progress | Tool-dependent |
| 4.1.2 Name, Role, Value | Partial | Pass | In Progress | ARIA labels needed for blocks |

## Timeline for Remediation

### Phase 1 (Immediate - now):
- Document accessible tool selections
- Create keyboard navigation guides
- Provide text-based code examples

### Phase 2 (Short-term - 2 months):
- Audit specific tool accessibility (Scratch, Python IDE, JavaScript environment)
- Create tool-specific accessibility guides
- Add ARIA labels and keyboard support guides

### Phase 3 (Medium-term - 6 months):
- Partner with tool developers on accessibility improvements
- Develop text-based alternatives for visual environments
- Create comprehensive debugging narration guides

### Phase 4 (Long-term - ongoing):
- Monitor tool accessibility improvements
- Continuously test with assistive technology users
- Update guidance as tools evolve

## Testing Recommendations

- **Screen Readers**: JAWS, NVDA (Windows); VoiceOver (Mac); TalkBack (Android)
- **Tools**: axe DevTools, WAVE, WCAG contrast checkers
- **Users**: Include blind/low-vision learners in testing; ask for feedback on code explanation clarity
- **Frequency**: Quarterly review of tools; annual comprehensive audit

## Resources

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessible Code Editors Guide](https://www.a11y-project.com/)
- [Scratch Accessibility](https://wiki.scratch.mit.edu/wiki/Accessibility)
- [Python IDE Accessibility](https://www.python.org/community/)
