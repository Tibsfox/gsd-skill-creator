import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TEMPLATES_DIR = resolve(
  'skills/physical-infrastructure/skills/simulation-bridge/references/artifact-templates'
);

function loadTemplate(filename: string): string {
  return readFileSync(`${TEMPLATES_DIR}/${filename}`, 'utf-8');
}

describe('Artifact template files exist', () => {
  it('pipe-network-calculator.tsx exists', () => {
    expect(() => loadTemplate('pipe-network-calculator.tsx')).not.toThrow();
  });
  it('electrical-load-balancer.tsx exists', () => {
    expect(() => loadTemplate('electrical-load-balancer.tsx')).not.toThrow();
  });
  it('thermal-comfort-map.tsx exists', () => {
    expect(() => loadTemplate('thermal-comfort-map.tsx')).not.toThrow();
  });
  it('solar-array-sizer.tsx exists', () => {
    expect(() => loadTemplate('solar-array-sizer.tsx')).not.toThrow();
  });
  it('README.md exists', () => {
    expect(() => loadTemplate('README.md')).not.toThrow();
  });
});

describe('Pipe network calculator', () => {
  let src: string;
  beforeAll(() => {
    src = loadTemplate('pipe-network-calculator.tsx');
  });

  it('contains React.useState', () => expect(src).toContain('React.useState'));
  it('contains Hardy-Cross related logic (hardyCross or dQ)', () => {
    expect(src.includes('hardyCross') || src.includes('dQ') || src.includes('Hardy')).toBe(true);
  });
  it('contains flow_LPM or flowRate parameter', () => {
    expect(src.includes('flow') || src.includes('LPM')).toBe(true);
  });
  it('contains velocity calculation', () => {
    expect(src.includes('velocity') || src.includes('v = ')).toBe(true);
  });
  it('contains pressure drop (deltaP or dP)', () => {
    expect(src.includes('deltaP') || src.includes('dP') || src.includes('pressure')).toBe(true);
  });
  it('contains visual output (table, chart, or SVG)', () => {
    expect(src.includes('<table') || src.includes('Chart') || src.includes('<svg')).toBe(true);
  });
  it('contains PE disclaimer', () => {
    expect(src.toLowerCase()).toContain('professional engineer');
  });
  it('contains export default or exports the component', () => {
    expect(src.includes('export default') || src.includes('module.exports')).toBe(true);
  });
});

describe('Electrical load balancer', () => {
  let src: string;
  beforeAll(() => {
    src = loadTemplate('electrical-load-balancer.tsx');
  });

  it('contains React.useState', () => expect(src).toContain('React.useState'));
  it('contains phase A, B, C references', () => {
    expect(src.includes('phase') || src.includes("'A'") || src.includes('"A"')).toBe(true);
  });
  it('contains load calculation (kW or watts)', () => {
    expect(src.includes('load') || src.includes('kW') || src.includes('watts')).toBe(true);
  });
  it('contains phase balance or imbalance calculation', () => {
    expect(src.includes('balance') || src.includes('imbalance')).toBe(true);
  });
  it('contains visual output', () => {
    expect(src.includes('<table') || src.includes('Chart') || src.includes('<svg')).toBe(true);
  });
  it('contains PE disclaimer', () => {
    expect(src.toLowerCase()).toContain('professional engineer');
  });
});

describe('Thermal comfort map', () => {
  let src: string;
  beforeAll(() => {
    src = loadTemplate('thermal-comfort-map.tsx');
  });

  it('contains React.useState', () => expect(src).toContain('React.useState'));
  it('contains temperature calculation', () => {
    expect(src.includes('temp') || src.includes('Temp') || src.includes('T(')).toBe(true);
  });
  it('contains color scale or color mapping', () => {
    expect(src.includes('color') || src.includes('Color')).toBe(true);
  });
  it('contains SVG rendering', () => expect(src).toContain('<svg'));
  it('contains rack or heat source concept', () => {
    expect(src.includes('rack') || src.includes('source') || src.includes('heat')).toBe(true);
  });
  it('contains PE disclaimer', () => {
    expect(src.toLowerCase()).toContain('professional engineer');
  });
});

describe('Solar array sizer', () => {
  let src: string;
  beforeAll(() => {
    src = loadTemplate('solar-array-sizer.tsx');
  });

  it('contains React.useState', () => expect(src).toContain('React.useState'));
  it('contains irradiance data (monthly values)', () => {
    expect(src.includes('irradiance') || src.includes('kWh')).toBe(true);
  });
  it('contains panel efficiency', () => {
    expect(src.includes('efficiency') || src.includes('0.20') || src.includes('0.18')).toBe(true);
  });
  it('contains annual production calculation', () => {
    expect(src.includes('annual') || src.includes('production')).toBe(true);
  });
  it('contains visual output', () => {
    expect(src.includes('Chart') || src.includes('<table') || src.includes('<svg')).toBe(true);
  });
  it('contains PE disclaimer', () => {
    expect(src.toLowerCase()).toContain('professional engineer');
  });
});

describe('Artifact templates README', () => {
  let readme: string;
  beforeAll(() => {
    readme = loadTemplate('README.md');
  });

  it('mentions all four template names', () => {
    expect(readme).toContain('pipe-network-calculator');
    expect(readme).toContain('electrical-load-balancer');
    expect(readme).toContain('thermal-comfort-map');
    expect(readme).toContain('solar-array-sizer');
  });
  it('mentions Claude artifacts or deployment', () => {
    expect(readme.toLowerCase()).toMatch(/artifact|deploy|claude/);
  });
});
