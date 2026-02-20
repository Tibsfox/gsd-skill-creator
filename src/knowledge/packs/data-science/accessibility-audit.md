# DATA-101: Accessibility Audit

**Status**: Alpha (2026-02-20)
**Target Compliance**: WCAG 2.1 AA

## Executive Summary

DATA-101 teaches data literacy through collection, analysis, visualization, and interpretation. Key accessibility challenge: data visualizations (charts, graphs) are typically visual-only, excluding users who are blind or have low vision. The pack emphasizes making data accessible through text descriptions and alternative formats.

## Detailed Audit

### 1. Charts & Graphs Accessibility

**Current Status**: Needs Improvement
**WCAG Criterion**: 1.1.1 Non-text Content (Level A), 1.4.11 Non-text Contrast (Level AA)

**Issues Found**:
- Bar charts, line graphs, pie charts require visual interpretation
- Color is often the only means to distinguish data series
- Complex charts may not have text alternatives

**Remediation Path** (Priority: HIGH):
1. **For every chart/graph**:
   - Always provide underlying data table with same information
   - Write text summary: "Q3 sales exceeded Q2 by 23% across all regions"
   - Use colorblind-safe palettes (avoid red/green combinations)
   - Ensure 3:1 contrast minimum between data series

2. **For complex visualizations**:
   - Provide long descriptions describing trends, outliers, relationships
   - Include data in CSV/structured format for analysis tools

3. **Testing**: With screen readers, verify complete information accessible without color

### 2. Data Tables

**Current Status**: Generally Accessible (with improvements needed)
**WCAG Criterion**: 1.3.1 Info and Relationships (Level A)

**Issues Found**:
- Some tables lack proper headers (`<th>` elements)
- Large tables may be difficult to navigate
- Merged cells can confuse screen readers

**Remediation Path** (Priority: MEDIUM):
1. Ensure all data tables use semantic HTML (`<thead>`, `<tbody>`, `<th>` with scope)
2. Provide table summaries describing structure and key findings
3. For wide tables: provide row-by-row view option alongside table view
4. Test with: VoiceOver table navigation, NVDA table commands

### 3. Interactive Visualizations

**Current Status**: Low Accessibility
**WCAG Criterion**: 2.1.1 Keyboard (Level A), 2.4.7 Focus Visible (Level AA)

**Issues Found**:
- Interactive dashboards often require mouse hover for data details
- Zoom/pan interactions may not be keyboard-accessible
- Tooltips may not be announced by screen readers

**Remediation Path** (Priority: MEDIUM):
1. Ensure keyboard navigation to all interactive elements
2. Make hover information also available on focus
3. Use ARIA labels for interactive controls
4. Provide text-based data view as alternative to interactive visualization

### 4. Statistical Concepts & Notation

**Current Status**: Partially Accessible
**WCAG Criterion**: 1.1.1 Non-text Content, 1.3.1 Info and Relationships

**Issues Found**:
- Mathematical notation (σ, Σ, mean symbol) may not be announced by screen readers
- Statistical concepts often explained through visual examples

**Remediation Path** (Priority: MEDIUM):
1. Use MathML for mathematical notation with spell-out: `<math><mrow><mi>σ</mi></mrow></math>` with text "sigma"
2. Provide text explanations alongside all formula-based content
3. Use spelled-out variable names in code examples: "mean_height" not "x̄"
4. Offer multiple explanation formats: visual, textual, symbolic

### 5. Activities & Experiments

**Current Status**: Partially Accessible
**WCAG Criterion**: 1.1.1 Non-text Content, 2.1.1 Keyboard

**Issues Found**:
- Data collection activities may require specific tools (spreadsheets, graphing software)
- Simulation/visualization tools vary in accessibility
- Peer data critique activities depend on visual representations

**Remediation Path** (Priority: MEDIUM):
1. Provide data in accessible formats (CSV, plaintext) for analysis with assistive tech
2. Make spreadsheet tools keyboard-accessible (LibreOffice Calc, Excel)
3. For simulations: include parameter descriptions and outcome text
4. Peer review: facilitate text-based discussion of data findings, not pointing to visual elements

### 6. Resources & Examples

**Current Status**: Mixed
**WCAG Criterion**: 1.1.1 Non-text Content

**Issues Found**:
- Real-world data visualizations (from Gapminder, OWID) may not have alt text
- Case studies often presented as visual infographics

**Remediation Path** (Priority**: LOW):
1. When citing external visualizations, provide your own text description
2. Reformat visual infographics as text-based case studies
3. Include source data links for learners who want to explore further

## WCAG 2.1 AA Compliance Checklist

| Criterion | Current | Target | Status | Notes |
|-----------|---------|--------|--------|-------|
| 1.1.1 Non-text Content | Partial | Pass | In Progress | All charts need alt text / data tables |
| 1.3.1 Info and Relationships | Partial | Pass | In Progress | Table headers, notation markup |
| 1.4.3 Contrast (Minimum) | Partial | Pass | In Progress | Chart color palettes |
| 1.4.11 Non-text Contrast | Partial | Pass | In Progress | Data series distinction |
| 2.1.1 Keyboard | Partial | Pass | In Progress | Interactive tool selection |
| 2.4.7 Focus Visible | Partial | Pass | In Progress | Dashboard/tool focus indicators |
| 4.1.2 Name, Role, Value | Partial | Pass | In Progress | ARIA labels on interactions |

## Timeline for Remediation

### Phase 1 (Immediate - now):
- Document colorblind-safe palette requirements
- Create text description template for common chart types
- Provide data table accompaniments for all visualizations

### Phase 2 (Short-term - 2 months):
- Audit all interactive visualization tools
- Create keyboard navigation guides
- Develop MathML templates for formulas

### Phase 3 (Medium-term - 6 months):
- Partner with visualization tool creators
- Create comprehensive alt-text guidelines for different chart types
- Develop activity adaptations for accessibility

### Phase 4 (Long-term - ongoing):
- Continuous review of visualization accessibility
- User testing with blind/low-vision learners
- Tool updates as libraries evolve

## Testing Recommendations

- **Blindness Simulation**: Use grayscale mode; test color-only distinction
- **Screen Readers**: JAWS, NVDA (Windows); VoiceOver (Mac)
- **Tools**: Contrast checkers (WebAIM), WAVE browser extension, axe DevTools
- **Users**: Include blind/low-vision learners; test with statistical software familiarity levels
- **Frequency**: Quarterly tool audits; annual comprehensive review

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Charts & Graphs](https://webaim.org/articles/)
- [Chartable - Accessibility for Data Visualization](https://chartable.media.mit.edu/)
- [Colorblind Safe Palettes](https://www.tableau.com/about/blog/2016/4/understanding-color-blindness)
- [MathML Accessibility](https://www.w3.org/Math/)
