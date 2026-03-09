/**
 * OutputSynthesis tests — Output Synthesis Layer
 * CF-19: Audio synthesis output
 * CF-20: DMX-512 frame output
 * CF-21: LED strip control
 * CF-22: Laser safety interlock
 * SC-LAS: Laser interlock safety-critical
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  OutputSynthesis,
  createOutputSynthesis,
  DMX_CHANNELS,
  DMX_OUTPUT_RATE_HZ,
  DEFAULT_AUDIO_PARAMS,
  FROG_PHASE_COLORS,
  createDmxFrame,
  createLedStrip,
} from '../output-synthesis.js';
import type { OutputMapping } from '../types.js';

describe('OutputSynthesis', () => {
  let synth: OutputSynthesis;

  beforeEach(() => {
    synth = createOutputSynthesis();
  });

  describe('audio synthesis (CF-19)', () => {
    it('provides default audio parameters', () => {
      const params = synth.getAudioParams();
      expect(params.oscillatorFreq).toBe(440);
      expect(params.filterCutoff).toBe(2000);
      expect(params.gain).toBe(0.5);
    });

    it('updates audio parameters', () => {
      synth.setAudioParams({ oscillatorFreq: 880, gain: 0.8 });
      const params = synth.getAudioParams();
      expect(params.oscillatorFreq).toBe(880);
      expect(params.gain).toBe(0.8);
      expect(params.filterCutoff).toBe(2000); // unchanged
    });

    it('synthesizes audio from mapped sensor', () => {
      const mapping: OutputMapping = {
        id: 'ctx-to-osc',
        source: 'context_fill',
        target: 'audio_oscillator',
        range: [0, 100],
        enabled: true,
      };
      synth.addMapping(mapping);

      const result = synth.synthesizeAudio('context_fill', 50);
      expect(result.oscillatorFreq).toBeGreaterThan(20);
      expect(result.oscillatorFreq).toBeLessThan(20000);
    });

    it('returns default params when no mapping exists', () => {
      const result = synth.synthesizeAudio('context_fill', 50);
      expect(result.oscillatorFreq).toBe(DEFAULT_AUDIO_PARAMS.oscillatorFreq);
    });

    it('exports DEFAULT_AUDIO_PARAMS constant', () => {
      expect(DEFAULT_AUDIO_PARAMS.envelopeAttack).toBe(0.01);
      expect(DEFAULT_AUDIO_PARAMS.envelopeSustain).toBe(0.7);
    });
  });

  describe('DMX-512 frame output (CF-20)', () => {
    it('has 512 channels', () => {
      expect(DMX_CHANNELS).toBe(512);
    });

    it('outputs at 44Hz rate', () => {
      expect(DMX_OUTPUT_RATE_HZ).toBe(44);
    });

    it('sets and reads DMX channels', () => {
      synth.setDmxChannel(0, 255);
      synth.setDmxChannel(1, 128);

      const frame = synth.generateDmxFrame();
      expect(frame.channels[0]).toBe(255);
      expect(frame.channels[1]).toBe(128);
      expect(frame.channels[2]).toBe(0);
    });

    it('clamps DMX values to 0-255', () => {
      synth.setDmxChannel(0, 300);
      synth.setDmxChannel(1, -10);

      const frame = synth.getDmxFrame();
      expect(frame.channels[0]).toBe(255);
      expect(frame.channels[1]).toBe(0);
    });

    it('ignores out-of-range channels', () => {
      synth.setDmxChannel(-1, 100);
      synth.setDmxChannel(512, 100);
      // No error thrown
      const frame = synth.generateDmxFrame();
      expect(frame.channels).toHaveLength(512);
    });

    it('generates sequential frame numbers', () => {
      const f1 = synth.generateDmxFrame();
      const f2 = synth.generateDmxFrame();
      expect(f2.frameNumber).toBe(f1.frameNumber + 1);
    });

    it('applies Frog phase to DMX frame', () => {
      const frame = synth.applyPhaseToFrame('CLASSIFY', 0);
      // CLASSIFY is red with intensity 1.0
      expect(frame.channels[0]).toBe(255); // R
      expect(frame.channels[1]).toBe(0);   // G
      expect(frame.channels[2]).toBe(0);   // B
    });

    it('creates blank DMX frame via factory', () => {
      const frame = createDmxFrame(0);
      expect(frame.channels).toHaveLength(512);
      expect(frame.channels.every(c => c === 0)).toBe(true);
    });
  });

  describe('LED strip control (CF-21)', () => {
    it('initializes LED strip with pixel count', () => {
      synth.initLedStrip(60);
      const strip = synth.getLedStrip();
      expect(strip).not.toBeNull();
      expect(strip!.pixelCount).toBe(60);
      expect(strip!.pixels).toHaveLength(60);
    });

    it('sets individual pixel colors', () => {
      synth.initLedStrip(10);
      synth.setPixel(0, 255, 0, 128, 0.8);

      const strip = synth.getLedStrip();
      expect(strip!.pixels[0]).toEqual({ r: 255, g: 0, b: 128, brightness: 0.8 });
    });

    it('clamps pixel values', () => {
      synth.initLedStrip(5);
      synth.setPixel(0, 300, -10, 128, 2.0);

      const strip = synth.getLedStrip();
      expect(strip!.pixels[0].r).toBe(255);
      expect(strip!.pixels[0].g).toBe(0);
      expect(strip!.pixels[0].brightness).toBe(1);
    });

    it('sets global brightness', () => {
      synth.initLedStrip(10);
      synth.setGlobalBrightness(0.5);

      const strip = synth.getLedStrip();
      expect(strip!.globalBrightness).toBe(0.5);
    });

    it('applies Frog phase to LED strip', () => {
      synth.initLedStrip(5);
      synth.applyPhaseToStrip('BASELINE');

      const strip = synth.getLedStrip();
      // BASELINE is green, intensity 0.3
      expect(strip!.pixels[0].r).toBe(0);
      expect(strip!.pixels[0].g).toBe(128);
      expect(strip!.pixels[0].brightness).toBe(0.3);
    });

    it('returns null when strip not initialized', () => {
      expect(synth.getLedStrip()).toBeNull();
    });

    it('creates LED strip via factory', () => {
      const strip = createLedStrip(30);
      expect(strip.pixelCount).toBe(30);
      expect(strip.pixels[0]).toEqual({ r: 0, g: 0, b: 0, brightness: 1 });
    });
  });

  describe('laser safety interlock (CF-22, SC-LAS)', () => {
    it('REFUSES laser output without confirmed interlock (SC-LAS)', () => {
      // Default state — no interlock
      const point = synth.generateLaserPoint(0, 0, 255, 0, 0);
      expect(point).toBeNull();
    });

    it('REFUSES laser output when interlock DISENGAGED', () => {
      synth.setLaserInterlock('DISENGAGED', false);
      const point = synth.generateLaserPoint(0, 0, 255, 0, 0);
      expect(point).toBeNull();
    });

    it('REFUSES laser output when interlock FAULT', () => {
      synth.setLaserInterlock('FAULT', false);
      const point = synth.generateLaserPoint(0, 0, 255, 0, 0);
      expect(point).toBeNull();
    });

    it('REFUSES laser output when ENGAGED but NOT confirmed', () => {
      synth.setLaserInterlock('ENGAGED', false);
      const point = synth.generateLaserPoint(0, 0, 255, 0, 0);
      expect(point).toBeNull();
    });

    it('allows laser output only when ENGAGED AND confirmed', () => {
      synth.setLaserInterlock('ENGAGED', true);
      const point = synth.generateLaserPoint(1000, -2000, 255, 128, 0);

      expect(point).not.toBeNull();
      expect(point!.x).toBe(1000);
      expect(point!.y).toBe(-2000);
      expect(point!.r).toBe(255);
      expect(point!.blanking).toBe(false);
    });

    it('clamps ILDA coordinates to valid range', () => {
      synth.setLaserInterlock('ENGAGED', true);
      const point = synth.generateLaserPoint(50000, -50000, 300, 0, 0);

      expect(point!.x).toBe(32767);
      expect(point!.y).toBe(-32768);
      expect(point!.r).toBe(255);
    });

    it('generates blanking points with interlock', () => {
      synth.setLaserInterlock('ENGAGED', true);
      const point = synth.generateBlankingPoint(100, 200);

      expect(point).not.toBeNull();
      expect(point!.blanking).toBe(true);
      expect(point!.r).toBe(0);
      expect(point!.g).toBe(0);
      expect(point!.b).toBe(0);
    });

    it('REFUSES blanking points without interlock', () => {
      const point = synth.generateBlankingPoint(100, 200);
      expect(point).toBeNull();
    });

    it('tracks laser safety state', () => {
      synth.setLaserInterlock('ENGAGED', true);
      const safety = synth.getLaserSafety();

      expect(safety.interlockStatus).toBe('ENGAGED');
      expect(safety.interlockConfirmed).toBe(true);
      expect(safety.outputEnabled).toBe(true);
      expect(safety.lastCheckTimestamp).toBeGreaterThan(0);
    });

    it('disables output when interlock lost after being engaged', () => {
      synth.setLaserInterlock('ENGAGED', true);
      expect(synth.generateLaserPoint(0, 0, 255, 0, 0)).not.toBeNull();

      synth.setLaserInterlock('DISENGAGED', false);
      expect(synth.generateLaserPoint(0, 0, 255, 0, 0)).toBeNull();
    });
  });

  describe('Frog phase color schemes', () => {
    it('defines colors for all 6 phases', () => {
      const phases = ['BASELINE', 'SILENCE', 'ASSESS', 'PROBE', 'CLASSIFY', 'RESUME'] as const;
      for (const phase of phases) {
        const scheme = FROG_PHASE_COLORS[phase];
        expect(scheme.primary).toHaveLength(3);
        expect(scheme.secondary).toHaveLength(3);
        expect(scheme.intensity).toBeGreaterThanOrEqual(0);
        expect(scheme.intensity).toBeLessThanOrEqual(1);
      }
    });

    it('gets phase color scheme from engine', () => {
      const scheme = synth.getPhaseColorScheme('CLASSIFY');
      expect(scheme.primary).toEqual([255, 0, 0]);
      expect(scheme.intensity).toBe(1.0);
    });
  });

  describe('mapping configuration', () => {
    it('adds and retrieves mappings', () => {
      synth.addMapping({
        id: 'm1',
        source: 'context_fill',
        target: 'dmx_channel',
        range: [0, 100],
        enabled: true,
      });

      expect(synth.getMappings()).toHaveLength(1);
    });

    it('removes mappings', () => {
      synth.addMapping({
        id: 'm1',
        source: 'context_fill',
        target: 'dmx_channel',
        range: [0, 100],
        enabled: true,
      });
      synth.removeMapping('m1');
      expect(synth.getMappings()).toHaveLength(0);
    });

    it('hot-reloads mappings atomically', () => {
      synth.addMapping({
        id: 'old',
        source: 'context_fill',
        target: 'dmx_channel',
        range: [0, 100],
        enabled: true,
      });

      synth.reloadMappings([
        { id: 'new1', source: 'error_rate', target: 'led_color', range: [0, 50], enabled: true },
        { id: 'new2', source: 'token_budget', target: 'led_brightness', range: [0, 100], enabled: true },
      ]);

      const mappings = synth.getMappings();
      expect(mappings).toHaveLength(2);
      expect(mappings.find(m => m.id === 'old')).toBeUndefined();
    });
  });

  describe('engine lifecycle', () => {
    it('starts and stops', () => {
      expect(synth.running).toBe(false);
      synth.start();
      expect(synth.running).toBe(true);
      synth.stop();
      expect(synth.running).toBe(false);
    });

    it('tracks current phase', () => {
      synth.setPhase('PROBE');
      expect(synth.getPhase()).toBe('PROBE');
    });

    it('resets all state', () => {
      synth.initLedStrip(10);
      synth.setLaserInterlock('ENGAGED', true);
      synth.setPhase('CLASSIFY');
      synth.start();

      synth.reset();

      expect(synth.running).toBe(false);
      expect(synth.getPhase()).toBe('BASELINE');
      expect(synth.getLedStrip()).toBeNull();
      expect(synth.getLaserSafety().outputEnabled).toBe(false);
      expect(synth.getMappings()).toHaveLength(0);
    });
  });
});
