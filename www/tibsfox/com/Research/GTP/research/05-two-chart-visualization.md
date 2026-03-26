# Two-Chart Visualization Specification

## Table of Contents

- [Overview](#overview)
- [Pedagogical Purpose](#pedagogical-purpose)
- [View A: The Market Chart](#view-a-the-market-chart)
- [View B: The Network Chart](#view-b-the-network-chart)
- [Toggle Interaction](#toggle-interaction)
- [Data Specification](#data-specification)
- [D3.js Implementation](#d3js-implementation)
- [Visual Design](#visual-design)
- [Animation and Transitions](#animation-and-transitions)
- [Annotations](#annotations)
- [User Exercise: The Two Charts](#user-exercise-the-two-charts)
- [Responsive Behavior](#responsive-behavior)
- [Accessibility](#accessibility)
- [Static Fallback](#static-fallback)
- [Testing](#testing)
- [Cross-References](#cross-references)

---

## Overview

Room 4's "Chart That Lies" exercise is a D3.js interactive visualization that produces two views of the same entity -- Geggy Tah -- using the same time axis but different metrics. The toggle between views is the lesson: the same band, measured by market metrics, appears as a brief blip followed by a long flatline; measured by network influence, it appears as an exponential growth curve.

> "Same band. Same data. Radically different story." -- GTP Mission Package

The exercise teaches a fundamental analytical skill: **the metric you choose determines the story you tell.** Network analysis reveals what market analysis hides. This is the Room 4 premise made interactive and visceral.

---

## Pedagogical Purpose

### What the Visualization Teaches

1. **Metric selection shapes narrative.** The same entity (Geggy Tah) tells two completely different stories depending on what you measure. Neither story is false. Both are incomplete alone.

2. **Market metrics erase networks.** Billboard chart positions, album sales, and commercial activity measure commercial visibility. They say nothing about the people who passed through the creative field and what they carried forward.

3. **Network metrics reveal ecosystems.** Counting Grammys won by alumni, institutions founded, instruments redefined, and careers catalyzed tells the story of influence -- which is what actually propagates through creative communities.

4. **The "one-hit wonder" frame is a measurement artifact.** Geggy Tah produced one chart hit. They also produced a nine-time Grammy-winning producer, a psychoacoustics researcher, and the modern theremin's greatest practitioner. The "one-hit wonder" label is a consequence of measuring the wrong thing.

### The Insight Sequence

The visualization is designed to produce this sequence of realizations:

1. **First view (Market):** "Oh, they really were a one-hit wonder. Brief spike, long flatline."
2. **Toggle (Network):** "Wait -- that's the same band? The influence is *increasing* decades after they stopped recording?"
3. **Toggle back and forth:** "The market chart is *hiding* the real story."
4. **Generalization:** "What other bands/artists/creative communities look like failures by market metrics but successes by network metrics?"

This sequence is the pedagogical core of Room 4.

---

## View A: The Market Chart

### Description

A standard time-series chart showing Geggy Tah's commercial performance from 1994 to 2025. The visual impression is a brief blip (one chart entry) followed by decades of flatline.

### Axis Configuration

| Axis | Property | Value |
|------|----------|-------|
| X-axis | Range | 1994-2025 |
| X-axis | Type | Time (years) |
| X-axis | Label | "Year" |
| Y-axis | Range | 0-100 |
| Y-axis | Type | Linear |
| Y-axis | Label | "Commercial Impact (inverted chart position)" |

### Data Points

| Year | Value | Label | Annotation |
|------|-------|-------|------------|
| 1994 | 0 | Grand Opening | Debut album released on Luaka Bop. No chart impact. |
| 1996 | 84 | Sacred Cow | "Whoever You Are" reaches #16 Modern Rock (inverted: 100-16=84). |
| 1998 | 5 | Mercedes-Benz | Commercial use revives awareness briefly. |
| 2001 | 0 | Into the Oh | Third album. No significant chart position. |
| 2002-2025 | 0 | Inactive | Band inactive. Zero commercial activity. |

### Visual Properties

| Property | Value |
|----------|-------|
| Line color | `#757575` (subtle gray) |
| Line width | 2px |
| Fill | Area chart fill below line, `rgba(117, 117, 117, 0.1)` |
| Data points | Circles, 6px radius, filled `#757575` |
| Highlight point | Sacred Cow 1996 -- circle 8px, filled `#FF8F00` |
| Grid | Light horizontal lines at 20-unit intervals |
| Title | "The Market View: Commercial Metrics" |
| Subtitle | "Chart positions, commercial activity, public visibility" |

### Visual Impression

The chart should communicate at a glance: **brief activity, long silence.** The area fill makes the flatline dramatic. The single spike (Sacred Cow) stands alone. This is the "one-hit wonder" picture.

---

## View B: The Network Chart

### Description

A time-series chart showing cumulative network influence radiating from the Geggy Tah creative field from 1994 to 2025. The visual impression is an exponential growth curve that continues rising decades after the band stopped recording.

### Axis Configuration

| Axis | Property | Value |
|------|----------|-------|
| X-axis | Range | 1994-2025 |
| X-axis | Type | Time (years) |
| X-axis | Label | "Year" |
| Y-axis | Range | 0-20 (auto-scales) |
| Y-axis | Type | Linear |
| Y-axis | Label | "Cumulative Network Influence" |

### Data Points

| Year | Value | Label | Annotation |
|------|-------|-------|------------|
| 1994 | 1 | Rogers Transforms | Susan Rogers, Prince's engineer, has her artistic breakthrough in a Pomona home studio. |
| 1996 | 2 | Sacred Cow Ships | Second album; Rogers' second co-production. Daren Hahn joins on drums. |
| 1999 | 3 | Pamelia Discovers Theremin | Pamelia Stickney is handed a theremin during Into the Oh sessions. A new trajectory begins. |
| 2001 | 4 | Into the Oh + Network Expands | Third album brings Gadson, Anderson, Millstein. Network reaches 11+ nodes. |
| 2006 | 6 | Bird & the Bee | Kurstin forms The Bird and the Bee with Inara George. Pop production career begins. |
| 2008 | 7 | Pamelia at TED | Stickney delivers TED talk. Theremin reaches new audiences. |
| 2010 | 8 | Rogers at Berklee | Rogers joins Berklee College of Music. Music Perception and Cognition Lab established. |
| 2012 | 10 | First US #1 | Kurstin co-writes/produces first US #1 single. Production DNA from GT reaches pop mainstream. |
| 2015 | 13 | Adele "Hello" | Kurstin co-writes and produces "Hello." Most-viewed video on YouTube at time of release. |
| 2017 | 15 | Grammy Breakthrough | Kurstin wins multiple Grammys. The Geggy Tah production DNA is now the most awarded in pop. |
| 2020 | 17 | Rogers' Research Published | Psychoacoustics research from Berklee. The question "why does music affect us?" traced back to GT studio. |
| 2023 | 19 | 9 Grammys | Kurstin reaches 9 Grammy Awards. Foo Fighters, Beck, Sia, Pink, Halsey. The inclusionary practice at industrial scale. |
| 2025 | 20 | Continuing Influence | Jordan continues LA music. Rogers at Berklee. Stickney in Vienna. Network still active. |

### Visual Properties

| Property | Value |
|----------|-------|
| Line color | `#311B92` (primary deep violet) |
| Line width | 3px |
| Fill | Area chart fill below line, `rgba(49, 27, 146, 0.15)` |
| Data points | Circles, 6px radius, filled with group-specific colors |
| Highlight points | Adele "Hello" (2015) and 9 Grammys (2023) -- circles 8px, filled `#FF8F00` |
| Grid | Light horizontal lines at 5-unit intervals |
| Title | "The Network View: Creative Influence" |
| Subtitle | "Grammys won by alumni, institutions founded, instruments redefined, careers catalyzed" |

### Color-Coded Data Points

Each data point in the network chart is color-coded by the person it primarily represents:

| Color | Person(s) | Data Points |
|-------|-----------|-------------|
| `#FF8F00` (amber) | Kurstin | Bird & Bee, US #1, Adele, Grammys |
| `#311B92` (violet) | Rogers | Rogers Transforms, Berklee, Research |
| `#E65100` (orange) | Stickney | Theremin Discovery, TED |
| `#4A148C` (purple) | Multiple | Into the Oh (network expansion) |

### Visual Impression

The chart should communicate at a glance: **sustained, accelerating growth.** The area fill makes the exponential curve dramatic. The absence of any flatline period contrasts sharply with View A. This is the "creative ecosystem" picture.

---

## Toggle Interaction

### Toggle Control

A single toggle button positioned above the chart area:

```html
<div class="chart-toggle">
  <button id="market-view" class="toggle-btn active">Market View</button>
  <button id="network-view" class="toggle-btn">Network View</button>
</div>
```

### Toggle Behavior

| Action | Result |
|--------|--------|
| Click "Market View" | Chart transitions to View A with 800ms animation |
| Click "Network View" | Chart transitions to View B with 800ms animation |
| Active state | Active button has `background: #311B92; color: white` |
| Inactive state | Inactive button has `background: #EDE7F6; color: #311B92` |

### Transition Animation

The toggle transition should be **dramatic** -- this is where the lesson hits. The animation should make the user *feel* the difference between the two stories.

1. **Y-axis rescales** -- Market Y-axis (0-100) morphs to Network Y-axis (0-20) with 400ms ease
2. **Data points move** -- Points slide along Y-axis to new positions with 600ms spring easing
3. **Line redraws** -- Path element morphs from flatline to growth curve (or reverse) with 800ms transition
4. **Area fill recolors** -- Gray fill transitions to violet fill (or reverse) with 400ms crossfade
5. **Title updates** -- Title text fades out (200ms), changes, fades in (200ms)
6. **Annotations reposition** -- Annotation callouts slide to new positions

### Keyboard Support

| Key | Action |
|-----|--------|
| Tab | Move focus between toggle buttons |
| Enter/Space | Activate focused toggle |
| 1 | Switch to Market View |
| 2 | Switch to Network View |

---

## Data Specification

### TypeScript Interfaces

```typescript
interface TwoChartData {
  marketData: ChartDataPoint[];
  networkData: ChartDataPoint[];
  timeRange: { start: number; end: number };
  labels: {
    market: { title: string; subtitle: string; yAxis: string };
    network: { title: string; subtitle: string; yAxis: string };
  };
}

interface ChartDataPoint {
  year: number;
  value: number;
  label: string;
  tooltip: string;
  color?: string;           // Point color (network view)
  highlight?: boolean;      // Enlarged point
}
```

### Embedded Data

```javascript
const gtChartData = {
  timeRange: { start: 1994, end: 2025 },
  labels: {
    market: {
      title: 'The Market View: Commercial Metrics',
      subtitle: 'Chart positions, commercial activity, public visibility',
      yAxis: 'Commercial Impact'
    },
    network: {
      title: 'The Network View: Creative Influence',
      subtitle: 'Grammys by alumni, institutions founded, instruments redefined',
      yAxis: 'Cumulative Network Influence'
    }
  },
  marketData: [
    { year: 1994, value: 0, label: 'Grand Opening', tooltip: 'Debut album. No chart impact.' },
    { year: 1996, value: 84, label: 'Sacred Cow', tooltip: '"Whoever You Are" #16 Modern Rock', highlight: true },
    { year: 1998, value: 5, label: 'Mercedes-Benz', tooltip: 'Commercial briefly revives awareness' },
    { year: 2001, value: 0, label: 'Into the Oh', tooltip: 'Third album. No significant chart.' },
    { year: 2005, value: 0, label: 'Inactive', tooltip: 'Band inactive since ~2001' },
    { year: 2010, value: 0, label: '', tooltip: '' },
    { year: 2015, value: 0, label: '', tooltip: '' },
    { year: 2020, value: 0, label: '', tooltip: '' },
    { year: 2025, value: 0, label: '', tooltip: '' }
  ],
  networkData: [
    { year: 1994, value: 1, label: 'Rogers Transforms', tooltip: 'Prince\'s engineer has artistic breakthrough in Pomona', color: '#311B92' },
    { year: 1996, value: 2, label: 'Sacred Cow', tooltip: 'Second co-production with Rogers. Hahn joins.', color: '#311B92' },
    { year: 1999, value: 3, label: 'Pamelia', tooltip: 'Stickney discovers the theremin', color: '#E65100' },
    { year: 2001, value: 4, label: 'Network Expands', tooltip: 'Into the Oh: Gadson, Anderson, Millstein join', color: '#4A148C' },
    { year: 2006, value: 6, label: 'Bird & Bee', tooltip: 'Kurstin forms The Bird and the Bee', color: '#FF8F00' },
    { year: 2008, value: 7, label: 'Pamelia TED', tooltip: 'Stickney delivers TED talk on theremin', color: '#E65100' },
    { year: 2010, value: 8, label: 'Rogers Berklee', tooltip: 'Rogers joins Berklee, founds cognition lab', color: '#311B92' },
    { year: 2012, value: 10, label: 'US #1', tooltip: 'Kurstin co-writes first US #1 single', color: '#FF8F00' },
    { year: 2015, value: 13, label: 'Adele "Hello"', tooltip: 'Kurstin co-writes/produces. Most-viewed video.', color: '#FF8F00', highlight: true },
    { year: 2017, value: 15, label: 'Grammys', tooltip: 'Kurstin wins multiple Grammys', color: '#FF8F00' },
    { year: 2020, value: 17, label: 'Rogers Research', tooltip: 'Psychoacoustics publications from Berklee', color: '#311B92' },
    { year: 2023, value: 19, label: '9 Grammys', tooltip: 'Kurstin: 9 Grammy Awards total', color: '#FF8F00', highlight: true },
    { year: 2025, value: 20, label: 'Continuing', tooltip: 'Network still active across 4 domains', color: '#4A148C' }
  ]
};
```

---

## D3.js Implementation

### Chart Scaffold

```javascript
const margin = { top: 60, right: 30, bottom: 50, left: 60 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select('#two-chart')
  .append('svg')
  .attr('viewBox', `0 0 700 400`)
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear()
  .domain([1994, 2025])
  .range([0, width]);

let yScale = d3.scaleLinear()
  .domain([0, 100])  // Market view initial
  .range([height, 0]);

const line = d3.line()
  .x(d => xScale(d.year))
  .y(d => yScale(d.value))
  .curve(d3.curveMonotoneX);

const area = d3.area()
  .x(d => xScale(d.year))
  .y0(height)
  .y1(d => yScale(d.value))
  .curve(d3.curveMonotoneX);
```

### Toggle Function

```javascript
function toggleView(view) {
  const data = view === 'market' ? gtChartData.marketData : gtChartData.networkData;
  const labels = view === 'market' ? gtChartData.labels.market : gtChartData.labels.network;
  const maxY = view === 'market' ? 100 : 22;
  const lineColor = view === 'market' ? '#757575' : '#311B92';
  const fillColor = view === 'market' ? 'rgba(117,117,117,0.1)' : 'rgba(49,27,146,0.15)';

  yScale.domain([0, maxY]);

  // Animate transitions
  svg.select('.chart-line')
    .transition().duration(800).ease(d3.easeCubicInOut)
    .attr('d', line(data))
    .attr('stroke', lineColor);

  svg.select('.chart-area')
    .transition().duration(800).ease(d3.easeCubicInOut)
    .attr('d', area(data))
    .attr('fill', fillColor);

  // Update axes, points, labels...
}
```

---

## Visual Design

### Chart Container

| Property | Value |
|----------|-------|
| Background | `white` |
| Border | `1px solid var(--mist)` |
| Border radius | `8px` |
| Padding | `16px` |
| Max width | `700px` |
| Shadow | `0 2px 8px rgba(0,0,0,0.05)` |

### Color Palette

| Element | Market View | Network View |
|---------|-------------|-------------|
| Line | `#757575` | `#311B92` |
| Area fill | `rgba(117,117,117,0.1)` | `rgba(49,27,146,0.15)` |
| Grid lines | `#E0E0E0` | `#E0E0E0` |
| Axis labels | `#757575` | `#757575` |
| Title | `#424242` | `#311B92` |
| Data points | `#757575` | Per-person color |
| Highlight | `#FF8F00` | `#FF8F00` |

### Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Title | System sans-serif | 16px | Bold | See palette |
| Subtitle | System sans-serif | 12px | Normal | `#757575` |
| Axis label | System sans-serif | 11px | Normal | `#757575` |
| Data label | System sans-serif | 10px | Normal | `#424242` |
| Tooltip | System sans-serif | 12px | Normal | `#212121` |

---

## Animation and Transitions

### Transition Timeline

When the user toggles between views:

```
0ms     200ms    400ms    600ms    800ms
|--------|--------|--------|--------|
Title    Y-axis   Line     Area     Complete
fades    rescales morphs   recolors
out/in   (ease)   (cubic)  (fade)
```

### Easing Functions

| Element | Easing | Duration |
|---------|--------|----------|
| Y-axis rescale | `d3.easeQuadInOut` | 400ms |
| Line morph | `d3.easeCubicInOut` | 800ms |
| Area fill | `d3.easeLinear` | 400ms |
| Data points | `d3.easeBackOut` | 600ms |
| Title text | CSS opacity | 200ms fade |
| Annotations | `d3.easeQuadInOut` | 500ms |

### First-Load Animation

On initial page load, the market view line draws from left to right over 1200ms using `stroke-dasharray` animation, creating a reveal effect that draws attention to the flatline.

---

## Annotations

### Market View Annotations

| Year | Position | Text |
|------|----------|------|
| 1996 | Above spike | "#16 Modern Rock" |
| 2001 | Below flatline | "Band inactive" |
| 2010 | Center of flatline | "By market metrics: one-hit wonder" |

### Network View Annotations

| Year | Position | Text |
|------|----------|------|
| 1994 | Near first point | "Rogers transforms" |
| 2015 | Above Adele point | "Adele 'Hello' -- Kurstin" |
| 2023 | Above 9 Grammys point | "9 Grammys through Kurstin" |
| 2025 | End of curve | "By network metrics: creative ecosystem" |

### Annotation Style

```css
.annotation {
  font-family: system-ui, sans-serif;
  font-size: 10px;
  fill: #757575;
  font-style: italic;
}
.annotation-highlight {
  font-size: 11px;
  fill: #311B92;
  font-weight: 600;
  font-style: normal;
}
```

---

## User Exercise: The Two Charts

### Try Session: The Two Charts

After exploring the pre-loaded Geggy Tah data, users complete the exercise with their own chosen band or artist.

### Exercise Steps

1. **Choose a band or artist** -- any band where members went on to other projects.
2. **Gather market data** -- chart positions, album sales, commercial metrics over time.
3. **Gather network data** -- where did members go? What did they produce/found/catalyze?
4. **Enter data into the scaffold** -- the D3 template accepts custom data arrays.
5. **Toggle between views** -- compare the market story vs. the network story.
6. **Write one paragraph** -- what does the network chart reveal that the market chart hides?

### Exercise Data Template

```javascript
const myBandData = {
  timeRange: { start: /* year */, end: /* year */ },
  labels: {
    market: { title: 'Market View: [Band Name]', subtitle: '...', yAxis: 'Commercial Impact' },
    network: { title: 'Network View: [Band Name]', subtitle: '...', yAxis: 'Cumulative Influence' }
  },
  marketData: [
    // { year: YYYY, value: N, label: '...', tooltip: '...' }
  ],
  networkData: [
    // { year: YYYY, value: N, label: '...', tooltip: '...' }
  ]
};
```

### Suggested Bands for the Exercise

| Band | Why This Works |
|------|---------------|
| The Wrecking Crew | Session musicians behind 1960s hits; members catalyzed entire production careers |
| Talking Heads | Market: peaked in 80s. Network: Byrne's labels, Eno productions, solo careers |
| Fugazi | Market: never charted. Network: Dischord Records, independent music infrastructure |
| The Velvet Underground | Market: "didn't sell many records." Network: "everyone who bought one started a band" |
| Kraftwerk | Market: niche electronic. Network: every electronic music genre traces back to Dusseldorf |

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| > 768px | Full chart, 700x400 viewport, all annotations |
| 480-768px | Reduced to 100%x350, condensed annotations |
| < 480px | Simplified view with stacked toggle buttons, reduced label density |

### Touch Interaction

On touch devices:
- Tap data point to show tooltip
- Tap toggle button to switch views
- Swipe left/right for market/network toggle (optional enhancement)

---

## Accessibility

### ARIA Attributes

```html
<div id="two-chart-container" role="figure" aria-label="Two-chart comparison: Geggy Tah market metrics versus network influence">
  <div class="chart-toggle" role="radiogroup" aria-label="Chart view selector">
    <button role="radio" aria-checked="true" id="market-view">Market View</button>
    <button role="radio" aria-checked="false" id="network-view">Network View</button>
  </div>
  <svg role="img" aria-label="Chart visualization">...</svg>
</div>
```

### Screen Reader Description

A hidden `<div>` provides a text description:

```html
<div class="sr-only" id="chart-description">
  Market View: Geggy Tah's commercial performance shows one chart entry (#16 Modern Rock, 1996)
  followed by inactivity from 2001 onward. Network View: Cumulative influence grows from 1994
  to 2025, reaching 9 Grammys through Kurstin, a Berklee lab through Rogers, modern theremin
  practice through Stickney, and Jack Johnson collaboration through Jordan.
</div>
```

---

## Static Fallback

For environments without D3.js:

```html
<noscript>
  <div class="two-chart-fallback">
    <h4>The Chart That Lies</h4>
    <h5>Market View</h5>
    <table>
      <thead><tr><th>Year</th><th>Event</th><th>Chart Impact</th></tr></thead>
      <tbody>
        <tr><td>1994</td><td>Grand Opening</td><td>None</td></tr>
        <tr><td>1996</td><td>Sacred Cow</td><td>#16 Modern Rock</td></tr>
        <tr><td>2001</td><td>Into the Oh</td><td>None</td></tr>
        <tr><td>2002+</td><td>Inactive</td><td>None</td></tr>
      </tbody>
    </table>
    <h5>Network View</h5>
    <table>
      <thead><tr><th>Year</th><th>Event</th><th>Network Impact</th></tr></thead>
      <tbody>
        <tr><td>1994</td><td>Rogers Transforms</td><td>Engineer discovers new creative philosophy</td></tr>
        <tr><td>1999</td><td>Pamelia Discovers Theremin</td><td>Instrument's modern history redirected</td></tr>
        <tr><td>2006</td><td>Bird & the Bee</td><td>Kurstin begins pop production career</td></tr>
        <tr><td>2015</td><td>Adele "Hello"</td><td>GT production DNA reaches #1 worldwide</td></tr>
        <tr><td>2023</td><td>9 Grammys</td><td>Kurstin: most awarded producer of generation</td></tr>
      </tbody>
    </table>
    <p><strong>The lesson:</strong> Same band. Same time period. The metric you choose determines the story you tell.</p>
  </div>
</noscript>
```

---

## Testing

### Test Cases

| Test ID | Description | Expected Result |
|---------|-------------|----------------|
| CF-07 | Market view renders | Line chart shows flatline with one spike at 1996 |
| CF-07 | Network view renders | Line chart shows exponential growth curve |
| CF-07 | Toggle switches views | Smooth 800ms transition between views without error |
| CF-13 | User can substitute data | Custom data array renders correctly in both views |
| CF-13 | Sample data pre-loaded | GT data appears on first load without user input |
| EC-02 | D3 unavailable | Static table fallback renders with all data |
| -- | Responsive 320px | Chart renders legibly at mobile width |
| -- | Screen reader | Description and toggle roles are announced |
| -- | Keyboard | Tab focuses toggle buttons, Enter/Space activates |

### Verification Checklist

- [ ] Market view shows flatline visual impression
- [ ] Network view shows growth curve visual impression
- [ ] Toggle animation completes without visual glitch
- [ ] All data points have tooltips on hover
- [ ] Annotations appear at correct positions
- [ ] Toggle buttons have correct active/inactive styling
- [ ] Y-axis rescales during transition
- [ ] Area fill color transitions smoothly
- [ ] Custom data template documented and functional
- [ ] Static fallback includes all critical data

---

## Cross-References

- [Data Structure Specification](03-data-structure-specification.md) -- TwoChartData and ChartDataPoint interfaces
- [Research-to-Room Mapping](02-research-to-room-mapping.md) -- Room 4 panel mapping
- [Constellation Map Specification](04-constellation-map-specification.md) -- The other D3 visualization in the module
- [Source Material](01-source-material.md) -- Phase 1 Module 4 trajectory data
- [GGT -- Post-GT Trajectories](../GGT/page.html?doc=research/04-post-geggy-tah-trajectories) -- Original research
- [DAA -- Deep Audio Analysis](../DAA/index.html) -- Data visualization methodology
- [GRD -- Gradient Engine](../GRD/index.html) -- Color system for chart elements
- [ARC -- Shapes and Colors](../ARC/index.html) -- Visual pattern language for chart annotations

---

*Two-chart visualization specification for the Inclusionary Wave Educational Module. The toggle is the lesson. The metric is the story. The same band, measured two ways, teaches that network analysis reveals what market analysis hides -- and that the "one-hit wonder" frame is a measurement artifact, not a creative verdict.*
