import { describe, it, expect } from 'vitest';
import {
  renderServerBlock,
  renderToolBlock,
  renderResourceBlock,
  renderBlueprintStyles,
} from './blueprint-blocks.js';
import type { ServerBlockData, ToolBlockData, ResourceBlockData } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeServerData(overrides: Partial<ServerBlockData> = {}): ServerBlockData {
  return {
    serverId: overrides.serverId ?? 'test-server',
    serverName: overrides.serverName ?? 'TestMCP',
    status: overrides.status ?? 'connected',
    trustState: overrides.trustState ?? 'trusted',
    toolCount: overrides.toolCount ?? 2,
    resourceCount: overrides.resourceCount ?? 1,
    promptCount: overrides.promptCount ?? 0,
    tools: overrides.tools ?? [
      { name: 'read-file', description: 'Read a file from disk' },
      { name: 'write-file', description: 'Write a file to disk' },
    ],
    resources: overrides.resources ?? [
      { name: 'project-config', uri: 'gsd://project/config' },
    ],
  };
}

function makeToolData(overrides: Partial<ToolBlockData> = {}): ToolBlockData {
  return {
    toolName: overrides.toolName ?? 'read-file',
    description: overrides.description ?? 'Read a file from disk',
    serverId: overrides.serverId ?? 'test-server',
    parameters: overrides.parameters ?? [
      { name: 'path', type: 'string', required: true },
      { name: 'encoding', type: 'string', required: false },
    ],
  };
}

function makeResourceData(overrides: Partial<ResourceBlockData> = {}): ResourceBlockData {
  return {
    resourceName: overrides.resourceName ?? 'project-config',
    uri: overrides.uri ?? 'gsd://project/config',
    mimeType: overrides.mimeType,
    description: overrides.description,
    serverId: overrides.serverId ?? 'test-server',
    subscribed: overrides.subscribed ?? false,
  };
}

// ---------------------------------------------------------------------------
// renderServerBlock (PRES-01)
// ---------------------------------------------------------------------------

describe('renderServerBlock', () => {
  it('renders server name in the block', () => {
    const html = renderServerBlock(makeServerData({ serverName: 'MyServer' }));
    expect(html).toContain('MyServer');
  });

  it('shows connection status indicator with correct CSS class for connected', () => {
    const html = renderServerBlock(makeServerData({ status: 'connected' }));
    expect(html).toContain('bp-status-connected');
  });

  it('shows trust state badge for quarantine', () => {
    const html = renderServerBlock(makeServerData({ trustState: 'quarantine' }));
    expect(html).toContain('bp-trust-quarantine');
    expect(html).toContain('Quarantine');
  });

  it('shows trust state badge for provisional', () => {
    const html = renderServerBlock(makeServerData({ trustState: 'provisional' }));
    expect(html).toContain('bp-trust-provisional');
    expect(html).toContain('Provisional');
  });

  it('shows trust state badge for trusted', () => {
    const html = renderServerBlock(makeServerData({ trustState: 'trusted' }));
    expect(html).toContain('bp-trust-trusted');
    expect(html).toContain('Trusted');
  });

  it('shows trust state badge for suspended', () => {
    const html = renderServerBlock(makeServerData({ trustState: 'suspended' }));
    expect(html).toContain('bp-trust-suspended');
    expect(html).toContain('Suspended');
  });

  it('lists tool count and resource count', () => {
    const html = renderServerBlock(makeServerData({ toolCount: 5, resourceCount: 3, promptCount: 2 }));
    expect(html).toContain('5 tools');
    expect(html).toContain('3 resources');
    expect(html).toContain('2 prompts');
  });

  it('includes data-server-id attribute', () => {
    const html = renderServerBlock(makeServerData({ serverId: 'srv-42' }));
    expect(html).toContain('data-server-id="srv-42"');
  });

  it('shows tool names as output ports', () => {
    const html = renderServerBlock(makeServerData({
      tools: [
        { name: 'read-file', description: 'Read file' },
        { name: 'write-file', description: 'Write file' },
      ],
    }));
    expect(html).toContain('read-file');
    expect(html).toContain('write-file');
    expect(html).toContain('data-port-type="tool-call"');
  });

  it('shows resource names as output ports', () => {
    const html = renderServerBlock(makeServerData({
      resources: [{ name: 'config', uri: 'gsd://config' }],
    }));
    expect(html).toContain('config');
    expect(html).toContain('data-port-type="resource-data"');
  });

  it('disconnected server renders with dimmed styling', () => {
    const html = renderServerBlock(makeServerData({ status: 'disconnected' }));
    expect(html).toContain('bp-block-dimmed');
    expect(html).toContain('bp-status-disconnected');
  });
});

// ---------------------------------------------------------------------------
// renderToolBlock (PRES-02)
// ---------------------------------------------------------------------------

describe('renderToolBlock', () => {
  it('renders tool name and description', () => {
    const html = renderToolBlock(makeToolData({
      toolName: 'search-code',
      description: 'Search codebase',
    }));
    expect(html).toContain('search-code');
    expect(html).toContain('Search codebase');
  });

  it('shows parameter preview with types', () => {
    const html = renderToolBlock(makeToolData({
      parameters: [
        { name: 'query', type: 'string', required: true },
        { name: 'limit', type: 'number', required: false },
      ],
    }));
    expect(html).toContain('query');
    expect(html).toContain('string');
    expect(html).toContain('limit');
    expect(html).toContain('number');
  });

  it('includes agent-input port', () => {
    const html = renderToolBlock(makeToolData());
    expect(html).toContain('data-port-type="agent-input"');
    expect(html).toContain('invoke');
  });

  it('includes tool-result output port', () => {
    const html = renderToolBlock(makeToolData());
    expect(html).toContain('data-port-type="tool-result"');
    expect(html).toContain('result');
  });

  it('includes data-tool-name attribute', () => {
    const html = renderToolBlock(makeToolData({ toolName: 'my-tool' }));
    expect(html).toContain('data-tool-name="my-tool"');
  });

  it('truncates long parameter lists to first 3', () => {
    const html = renderToolBlock(makeToolData({
      parameters: [
        { name: 'p1', type: 'string', required: true },
        { name: 'p2', type: 'string', required: false },
        { name: 'p3', type: 'number', required: false },
        { name: 'p4', type: 'boolean', required: false },
        { name: 'p5', type: 'object', required: false },
      ],
    }));
    expect(html).toContain('p1');
    expect(html).toContain('p2');
    expect(html).toContain('p3');
    expect(html).not.toContain('bp-param-name">p4');
    expect(html).toContain('+2 more');
  });
});

// ---------------------------------------------------------------------------
// renderResourceBlock (PRES-03)
// ---------------------------------------------------------------------------

describe('renderResourceBlock', () => {
  it('renders resource name and URI', () => {
    const html = renderResourceBlock(makeResourceData({
      resourceName: 'project-state',
      uri: 'gsd://project/state',
    }));
    expect(html).toContain('project-state');
    expect(html).toContain('gsd://project/state');
  });

  it('shows MIME type when present', () => {
    const html = renderResourceBlock(makeResourceData({ mimeType: 'application/json' }));
    expect(html).toContain('application/json');
    expect(html).toContain('bp-resource-mime');
  });

  it('shows subscription indicator when subscribed', () => {
    const html = renderResourceBlock(makeResourceData({ subscribed: true }));
    expect(html).toContain('bp-subscription-active');
  });

  it('shows inactive subscription indicator when not subscribed', () => {
    const html = renderResourceBlock(makeResourceData({ subscribed: false }));
    expect(html).toContain('bp-subscription-inactive');
  });

  it('includes resource-data output port', () => {
    const html = renderResourceBlock(makeResourceData());
    expect(html).toContain('data-port-type="resource-data"');
    expect(html).toContain('data');
  });

  it('includes context input port', () => {
    const html = renderResourceBlock(makeResourceData());
    expect(html).toContain('data-port-type="context"');
    expect(html).toContain('context');
  });

  it('handles missing optional fields gracefully', () => {
    const html = renderResourceBlock(makeResourceData({
      mimeType: undefined,
      description: undefined,
    }));
    expect(html).not.toContain('bp-resource-mime');
    expect(html).not.toContain('bp-block-description');
    expect(html).toContain('bp-block-resource');
  });
});

// ---------------------------------------------------------------------------
// renderBlueprintStyles
// ---------------------------------------------------------------------------

describe('renderBlueprintStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderBlueprintStyles();
    expect(css.length).toBeGreaterThan(100);
  });

  it('contains trust state color classes', () => {
    const css = renderBlueprintStyles();
    expect(css).toContain('.bp-trust-quarantine');
    expect(css).toContain('.bp-trust-provisional');
    expect(css).toContain('.bp-trust-trusted');
    expect(css).toContain('.bp-trust-suspended');
  });

  it('contains status indicator classes', () => {
    const css = renderBlueprintStyles();
    expect(css).toContain('.bp-status-connected');
    expect(css).toContain('.bp-status-disconnected');
    expect(css).toContain('.bp-status-failed');
    expect(css).toContain('.bp-status-connecting');
  });
});
