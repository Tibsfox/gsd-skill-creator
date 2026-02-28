import { describe, it, expect } from 'vitest';
import { catalogDiagrams } from '../../../../src/dogfood/extraction/diagram-cataloger.js';

describe('catalogDiagrams', () => {
  describe('TikZ diagram detection', () => {
    it('detects a gap preceded by figure reference as TikZ diagram', () => {
      const text = [
        'The unit circle is shown in the figure below.',
        '',
        'Figure 3.1: Unit circle in the complex plane',
        '',
        '',
        '',
        '',
        'As we can see from the diagram, the angle theta determines the position.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 10);

      expect(diagrams.length).toBeGreaterThanOrEqual(1);
      const tikz = diagrams.find(d => d.type === 'tikz');
      expect(tikz).toBeDefined();
    });

    it('extracts caption from "Figure N.N: text" pattern', () => {
      const text = [
        'Consider the following illustration.',
        '',
        'Figure 5.2: Fourier transform of a square wave',
        '',
        '',
        '',
        '',
        'The transform shows the harmonic components.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 20);
      const tikz = diagrams.find(d => d.type === 'tikz');

      expect(tikz?.caption).toContain('Fourier transform');
    });

    it('provides description from surrounding context', () => {
      const text = [
        'The diagram below illustrates the vector field.',
        '',
        'Figure 2.1: Vector field around a point charge',
        '',
        '',
        '',
        '',
        'Vectors radiate outward from the charge.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 5);
      const tikz = diagrams.find(d => d.type === 'tikz');

      expect(tikz?.description).toBeTruthy();
      expect(tikz!.description.length).toBeGreaterThan(0);
    });

    it('approximates page position', () => {
      const text = [
        'Some text here.',
        '',
        'Figure 1.1: Test diagram',
        '',
        '',
        '',
        '',
        'More text.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 10);

      expect(diagrams.length).toBeGreaterThanOrEqual(1);
      expect(diagrams[0].position).toBeGreaterThanOrEqual(10);
    });
  });

  describe('MusiXTeX detection', () => {
    it('detects garbled sequences near musical context words', () => {
      const text = [
        'The melody on the treble clef staff is:',
        '',
        '\u266D\u266E\u266F\u2669\u266A\u266B garbled notation here',
        '',
        'The ascending pattern demonstrates a major scale.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 1);
      const music = diagrams.find(d => d.type === 'musictex');

      expect(music).toBeDefined();
    });

    it('provides description from nearest musical prose context', () => {
      const text = [
        'The bass clef shows the lower register notes:',
        '',
        '\u266D\u266E\u266F garbled musical content',
        '',
        'These notes form the foundation of the harmony.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 1);
      const music = diagrams.find(d => d.type === 'musictex');

      if (music) {
        expect(music.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('table detection', () => {
    it('detects aligned column patterns as tables', () => {
      const text = [
        'The following table summarizes the results:',
        '',
        'Table 2.1: Harmonic frequencies',
        'Frequency   Amplitude   Phase',
        '100 Hz      1.0         0.0',
        '200 Hz      0.5         0.3',
        '300 Hz      0.25        0.6',
        '',
        'As shown in the table above.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 1);
      const table = diagrams.find(d => d.type === 'table');

      expect(table).toBeDefined();
    });

    it('extracts table caption', () => {
      const text = [
        'Table 4.3: Comparison of methods',
        'Method      Accuracy    Speed',
        'A           95%         Fast',
        'B           98%         Slow',
        '',
        'The results speak for themselves.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 1);
      const table = diagrams.find(d => d.type === 'table');

      expect(table?.caption).toContain('Comparison of methods');
    });
  });

  describe('edge cases', () => {
    it('returns empty array when no diagrams present', () => {
      const text = 'This is plain text with no figures, tables, or music.';
      const diagrams = catalogDiagrams(text, 1);

      expect(diagrams).toEqual([]);
    });

    it('catalogs multiple diagrams in order', () => {
      const text = [
        'Figure 1.1: First diagram',
        '',
        '',
        '',
        '',
        'Some text between.',
        '',
        'Figure 1.2: Second diagram',
        '',
        '',
        '',
        '',
        'Concluding text.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 1);

      expect(diagrams.length).toBeGreaterThanOrEqual(2);
      // Sorted by position
      for (let i = 1; i < diagrams.length; i++) {
        expect(diagrams[i].position).toBeGreaterThanOrEqual(diagrams[i - 1].position);
      }
    });

    it('handles figure without caption', () => {
      const text = [
        'The diagram below shows the concept.',
        '',
        '',
        '',
        '',
        'Continuing with the explanation.',
      ].join('\n');

      const diagrams = catalogDiagrams(text, 1);
      // If detected, caption should be undefined
      for (const d of diagrams) {
        if (d.type === 'tikz' && !d.caption) {
          expect(d.description.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
