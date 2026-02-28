import { describe, it, expect } from 'vitest';
import {
  getChannels,
  getChannel,
  getChannelsByPriority,
  getChannelsByDomain,
} from '../../../src/integrations/upstream/registry';

describe('Channel Registry', () => {
  it('loads all 11 channels', () => {
    const channels = getChannels();
    expect(channels).toHaveLength(11);
  });

  it('each channel has required fields', () => {
    const channels = getChannels();
    for (const ch of channels) {
      expect(ch.name).toBeTruthy();
      expect(ch.url).toMatch(/^https:\/\//);
      expect(ch.type).toBeTruthy();
      expect(['P0', 'P1', 'P2', 'P3']).toContain(ch.priority);
      expect(ch.check_interval_hours).toBeGreaterThan(0);
      expect(ch.domains.length).toBeGreaterThan(0);
    }
  });

  it('all URLs are HTTPS public endpoints', () => {
    const channels = getChannels();
    for (const ch of channels) {
      expect(ch.url).toMatch(/^https:\/\//);
      expect(ch.url).not.toContain('token=');
      expect(ch.url).not.toContain('api_key=');
    }
  });

  it('channel names are unique', () => {
    const channels = getChannels();
    const names = channels.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has correct priority distribution', () => {
    const channels = getChannels();
    const p0 = channels.filter((c) => c.priority === 'P0');
    const p1 = channels.filter((c) => c.priority === 'P1');
    const p2 = channels.filter((c) => c.priority === 'P2');

    expect(p0.length).toBeGreaterThanOrEqual(3);
    expect(p1.length).toBeGreaterThanOrEqual(2);
    expect(p2.length).toBeGreaterThanOrEqual(2);
  });

  it('getChannel returns correct config by name', () => {
    const ch = getChannel('anthropic-docs');
    expect(ch).toBeDefined();
    expect(ch!.name).toBe('anthropic-docs');
    expect(ch!.url).toContain('docs.anthropic.com');
  });

  it('getChannel returns undefined for unknown name', () => {
    expect(getChannel('nonexistent')).toBeUndefined();
  });

  it('getChannelsByPriority filters correctly', () => {
    const p0 = getChannelsByPriority('P0');
    expect(p0.length).toBeGreaterThan(0);
    for (const ch of p0) {
      expect(ch.priority).toBe('P0');
    }
  });

  it('getChannelsByDomain filters correctly', () => {
    const skillChannels = getChannelsByDomain('skills');
    expect(skillChannels.length).toBeGreaterThan(0);
    for (const ch of skillChannels) {
      expect(ch.domains).toContain('skills');
    }
  });

  it('includes key Anthropic endpoints', () => {
    const names = getChannels().map((c) => c.name);
    expect(names).toContain('anthropic-docs');
    expect(names).toContain('anthropic-changelog');
    expect(names).toContain('claude-code-releases');
    expect(names).toContain('mcp-spec');
    expect(names).toContain('anthropic-status');
  });

  it('anthropic-status is P0 priority', () => {
    const ch = getChannel('anthropic-status');
    expect(ch).toBeDefined();
    expect(ch!.priority).toBe('P0');
  });

  it('all channels cover at least one domain', () => {
    const channels = getChannels();
    for (const ch of channels) {
      expect(ch.domains.length, `${ch.name} has no domains`).toBeGreaterThanOrEqual(1);
    }
  });
});
