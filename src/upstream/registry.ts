import type { ChannelConfig, Severity } from './types';

const CHANNELS: ChannelConfig[] = [
  {
    name: 'anthropic-docs',
    url: 'https://docs.anthropic.com',
    type: 'documentation',
    priority: 'P0',
    check_interval_hours: 6,
    domains: ['skills', 'agents', 'hooks', 'api'],
  },
  {
    name: 'anthropic-blog',
    url: 'https://www.anthropic.com/blog',
    type: 'blog',
    priority: 'P1',
    check_interval_hours: 12,
    domains: ['models', 'announcements'],
  },
  {
    name: 'anthropic-changelog',
    url: 'https://docs.anthropic.com/en/docs/about-claude/models',
    type: 'changelog',
    priority: 'P0',
    check_interval_hours: 6,
    domains: ['api', 'models', 'breaking-changes'],
  },
  {
    name: 'claude-code-releases',
    url: 'https://github.com/anthropics/claude-code/releases',
    type: 'releases',
    priority: 'P0',
    check_interval_hours: 6,
    domains: ['skills', 'agents', 'hooks', 'cli'],
  },
  {
    name: 'claude-code-issues',
    url: 'https://github.com/anthropics/claude-code/issues',
    type: 'issues',
    priority: 'P2',
    check_interval_hours: 24,
    domains: ['community', 'bugs'],
  },
  {
    name: 'anthropic-sdk-python',
    url: 'https://github.com/anthropics/anthropic-sdk-python/releases',
    type: 'releases',
    priority: 'P1',
    check_interval_hours: 12,
    domains: ['sdk', 'api'],
  },
  {
    name: 'anthropic-sdk-ts',
    url: 'https://github.com/anthropics/anthropic-sdk-typescript/releases',
    type: 'releases',
    priority: 'P1',
    check_interval_hours: 12,
    domains: ['sdk', 'api'],
  },
  {
    name: 'mcp-spec',
    url: 'https://github.com/modelcontextprotocol/specification',
    type: 'specification',
    priority: 'P1',
    check_interval_hours: 12,
    domains: ['mcp', 'protocol'],
  },
  {
    name: 'mcp-servers',
    url: 'https://github.com/modelcontextprotocol/servers',
    type: 'ecosystem',
    priority: 'P2',
    check_interval_hours: 24,
    domains: ['mcp', 'ecosystem'],
  },
  {
    name: 'anthropic-cookbook',
    url: 'https://github.com/anthropics/anthropic-cookbook',
    type: 'patterns',
    priority: 'P2',
    check_interval_hours: 24,
    domains: ['patterns', 'examples'],
  },
  {
    name: 'anthropic-status',
    url: 'https://status.anthropic.com',
    type: 'status',
    priority: 'P0',
    check_interval_hours: 1,
    domains: ['availability', 'outages'],
  },
];

/** Get all registered channels */
export function getChannels(): ChannelConfig[] {
  return [...CHANNELS];
}

/** Get a channel by name */
export function getChannel(name: string): ChannelConfig | undefined {
  return CHANNELS.find((c) => c.name === name);
}

/** Get channels filtered by priority */
export function getChannelsByPriority(severity: Severity): ChannelConfig[] {
  return CHANNELS.filter((c) => c.priority === severity);
}

/** Get channels that cover a specific domain */
export function getChannelsByDomain(domain: string): ChannelConfig[] {
  return CHANNELS.filter((c) => c.domains.includes(domain));
}
