/**
 * CLI command to initialize the .planning/security/ directory structure.
 *
 * Creates the filesystem contract that all security subsystems (sandbox
 * configurator, credential proxy, staging scanner, agent isolation
 * manager, security dashboard) rely on for structured state storage.
 *
 * Idempotent: safe to run multiple times. Existing files are not
 * overwritten. Directories are created with mode 0700 (owner only).
 *
 * @module commands/security-init
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Template content
// ---------------------------------------------------------------------------

const README_CONTENT = `# Security Directory Contract

This directory contains all runtime security state for the GSD-OS SSH Agent
Security system (v1.38). Every security subsystem writes structured data here
following the contracts defined below.

## Directory Structure

\`\`\`
.planning/security/
├── sandbox-profile.json        <- Sandbox Configurator writes (Phase 368)
├── proxy-config.json           <- Credential Proxy reads (Phase 369)
├── domain-allowlist.json       <- User configures, proxy reads
├── schemas.json                <- JSON Schema definitions for all types
├── README.md                   <- This file
├── events/                     <- All security components write
│   └── YYYY-MM-DD.jsonl        <- Append-only event log
└── blocked/                    <- Proxy writes blocked requests
    └── [timestamp]-[domain].json
\`\`\`

## Event Log Format (JSONL)

Security events are written to \`events/YYYY-MM-DD.jsonl\` in newline-delimited
JSON (JSONL) format. Each line is a complete JSON object representing one
SecurityEvent:

\`\`\`json
{"id":"evt-uuid","timestamp":"2026-02-26T10:30:45Z","severity":"info","source":"proxy","event_type":"request_blocked","detail":{"domain":"api.unauthorized.com","reason":"not in allowlist"}}
\`\`\`

**Append-only semantics:** Events are only appended, never modified or deleted.
Log rotation is the user's responsibility. Each day gets a new file.

### Severity Levels

| Level    | Meaning                               | Dashboard |
|----------|---------------------------------------|-----------|
| info     | Routine operational event             | Logged    |
| warning  | Potential security concern            | Amber     |
| critical | Active security threat                | Red       |
| blocked  | Threat detected and blocked           | Red       |

### Event Sources

| Source          | Component                          |
|-----------------|------------------------------------|
| sandbox         | OS-level sandbox (bubblewrap/Seatbelt) |
| proxy           | Credential proxy server            |
| staging         | Staging security scanner           |
| agent-isolation | Per-agent worktree isolation       |

## Sandbox Profile

Written by the Sandbox Configurator (Phase 368). Read by the bootstrap
script (Phase 373) before any agent process starts.

\`\`\`json
{
  "agent_id": "exec-001",
  "agent_type": "exec",
  "filesystem": {
    "write_dirs": ["/home/user/project", "/home/user/project/.planning"],
    "deny_read": ["/home/user/.ssh", "/home/user/.config", "/home/user/.aws"]
  },
  "network": {
    "allowed_domains": [
      {"domain": "api.anthropic.com", "credential_type": "api_key_header", "credential_source": "keychain", "header_name": "x-api-key"}
    ],
    "proxy_socket": "/tmp/security-proxy.sock"
  },
  "worktree_path": null
}
\`\`\`

## Proxy Configuration

Written by the setup wizard or CLI. Read by the Credential Proxy (Phase 369)
at startup and on SIGHUP (config reload without restart).

**SECURITY INVARIANT:** \`log_credentials\` is always \`false\`. This is enforced
at the type level in both TypeScript (z.literal(false)) and Rust (custom
Deserialize). No configuration change can enable credential logging.

\`\`\`json
{
  "socket_path": "/tmp/security-proxy.sock",
  "allowed_domains": [],
  "log_requests": true,
  "log_credentials": false
}
\`\`\`

## Domain Allowlist

User-editable file listing domains the proxy will forward requests to.
The proxy reads this on each request (or caches with SIGHUP invalidation).

\`\`\`json
{
  "allowed_domains": ["api.anthropic.com", "github.com", "registry.npmjs.org"]
}
\`\`\`

## Blocked Requests

Written by the proxy when a request is blocked. Each blocked request gets
its own JSON file named \`[ISO-timestamp]-[domain].json\`.

\`\`\`json
{
  "timestamp": "2026-02-26T10:30:45Z",
  "domain": "api.unauthorized.com",
  "agent_id": "exec-001",
  "reason": "domain not in allowlist",
  "status_code": null
}
\`\`\`

Blocked requests can be reviewed but not released by agents. Only the user
can modify the domain allowlist to permit future requests.

## File Permissions

| Path                       | Mode  | Meaning                    |
|----------------------------|-------|----------------------------|
| .planning/security/        | 0700  | Owner read+write+execute   |
| .planning/security/events/ | 0700  | Owner read+write+execute   |
| .planning/security/blocked/| 0700  | Owner read+write+execute   |
| proxy socket file          | 0600  | Owner read+write only      |

All directories are restricted to the owner to prevent other system users
from reading security events, credentials configuration, or proxy state.

## Initialization

Run the CLI command to create the directory structure:

\`\`\`typescript
import { securityInitCommand } from './commands/security-init.js';
await securityInitCommand('/path/to/project');
\`\`\`

Or via Tauri IPC from the desktop application:

\`\`\`typescript
await invoke('init_security_directory', { projectRoot: '/path/to/project' });
\`\`\`

## Downstream Integration

Phases 368-374 read and write to this directory:

| Phase | Component            | Reads                    | Writes                    |
|-------|----------------------|--------------------------|---------------------------|
| 368   | Sandbox Configurator | schemas.json             | sandbox-profile.json      |
| 369   | Credential Proxy     | proxy-config.json, domain-allowlist.json | events/, blocked/ |
| 370   | Staging Scanner      | events/                  | events/                   |
| 371   | Agent Isolation      | sandbox-profile.json     | events/                   |
| 372   | Security Dashboard   | events/, blocked/        | (read-only)               |
| 373   | Bootstrap Script     | sandbox-profile.json, proxy-config.json | events/      |
| 374   | Integration Tests    | all files                | events/ (test data)       |

## Warnings

- **Credentials never stored in this directory** (proxy runs outside sandbox)
- **Event log is append-only;** rotation is user's responsibility
- **Blocked requests can be reviewed but not released by agents**
- **Proxy config is read at startup and on SIGHUP**
`;

const SCHEMAS_JSON = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'GSD-OS Security Schemas',
  description:
    'JSON Schema definitions for all security data structures written to .planning/security/',
  definitions: {
    SecurityEvent: {
      type: 'object',
      required: ['id', 'timestamp', 'severity', 'source', 'event_type', 'detail'],
      properties: {
        id: { type: 'string', description: 'Unique event identifier' },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp',
        },
        severity: {
          type: 'string',
          enum: ['info', 'warning', 'critical', 'blocked'],
          description: 'Event severity level',
        },
        source: {
          type: 'string',
          enum: ['sandbox', 'proxy', 'staging', 'agent-isolation'],
          description: 'Subsystem that generated this event',
        },
        event_type: {
          type: 'string',
          description: 'Machine-readable event type',
        },
        detail: {
          type: 'object',
          additionalProperties: true,
          description: 'Subsystem-specific event data',
        },
      },
      additionalProperties: false,
    },
    SandboxProfile: {
      type: 'object',
      required: ['agent_id', 'agent_type', 'filesystem', 'network'],
      properties: {
        agent_id: { type: 'string' },
        agent_type: {
          type: 'string',
          enum: ['exec', 'verify', 'scout', 'main'],
        },
        filesystem: {
          type: 'object',
          required: ['write_dirs', 'deny_read'],
          properties: {
            write_dirs: { type: 'array', items: { type: 'string' } },
            deny_read: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
        network: {
          type: 'object',
          required: ['allowed_domains', 'proxy_socket'],
          properties: {
            allowed_domains: {
              type: 'array',
              items: { $ref: '#/definitions/DomainCredential' },
            },
            proxy_socket: { type: 'string' },
          },
          additionalProperties: false,
        },
        worktree_path: { type: 'string' },
      },
      additionalProperties: false,
    },
    ProxyConfig: {
      type: 'object',
      required: [
        'socket_path',
        'allowed_domains',
        'log_requests',
        'log_credentials',
      ],
      properties: {
        socket_path: { type: 'string' },
        allowed_domains: {
          type: 'array',
          items: { $ref: '#/definitions/DomainCredential' },
        },
        log_requests: { type: 'boolean' },
        log_credentials: {
          type: 'boolean',
          const: false,
          description: 'ALWAYS false. Type-enforced security invariant.',
        },
      },
      additionalProperties: false,
    },
    DomainCredential: {
      type: 'object',
      required: ['domain', 'credential_type', 'credential_source'],
      properties: {
        domain: { type: 'string' },
        credential_type: {
          type: 'string',
          enum: ['api_key_header', 'ssh_agent', 'bearer_token', 'basic_auth'],
        },
        credential_source: {
          type: 'string',
          enum: ['keychain', 'env', 'file'],
        },
        header_name: { type: 'string' },
      },
      additionalProperties: false,
    },
    AgentIsolationState: {
      type: 'object',
      required: [
        'agent_id',
        'agent_type',
        'worktree_path',
        'sandbox_profile',
        'status',
        'created_at',
      ],
      properties: {
        agent_id: { type: 'string' },
        agent_type: {
          type: 'string',
          enum: ['exec', 'verify', 'scout', 'main'],
        },
        worktree_path: { type: 'string' },
        sandbox_profile: { $ref: '#/definitions/SandboxProfile' },
        status: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
      },
      additionalProperties: false,
    },
    BlockedRequest: {
      type: 'object',
      required: ['timestamp', 'domain', 'agent_id', 'reason'],
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        domain: { type: 'string' },
        agent_id: { type: 'string' },
        reason: { type: 'string' },
        status_code: { type: ['integer', 'null'] },
      },
      additionalProperties: false,
    },
  },
};

const SANDBOX_PROFILE_TEMPLATE = {
  agent_id: 'main',
  agent_type: 'main',
  filesystem: {
    write_dirs: [],
    deny_read: [],
  },
  network: {
    allowed_domains: [],
    proxy_socket: '/tmp/security-proxy.sock',
  },
};

const PROXY_CONFIG_TEMPLATE = {
  socket_path: '/tmp/security-proxy.sock',
  allowed_domains: [],
  log_requests: true,
  log_credentials: false,
};

const DOMAIN_ALLOWLIST_TEMPLATE = {
  allowed_domains: [
    'api.anthropic.com',
    'github.com',
    'registry.npmjs.org',
  ],
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a directory with mode 0700 if it does not already exist.
 * If it exists, ensure permissions are set to 0700.
 */
async function ensureSecureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
  } catch {
    // Directory may already exist -- that's fine
  }
  // Ensure permissions are correct even if dir existed
  await fs.chmod(dirPath, 0o700);
}

/**
 * Write a file only if it does not already exist (idempotent).
 */
async function writeIfMissing(filePath: string, content: string): Promise<void> {
  try {
    await fs.access(filePath);
    // File exists -- skip
  } catch {
    // File does not exist -- write it
    await fs.writeFile(filePath, content, { encoding: 'utf-8' });
  }
}

/**
 * Initialize the .planning/security/ directory structure.
 *
 * Creates all required directories and template files for the security
 * subsystem. Idempotent: existing files and directories are not modified.
 *
 * @param projectRoot - Project root directory (default: process.cwd())
 */
export async function initSecurityDirectory(projectRoot?: string): Promise<void> {
  const root = projectRoot ?? process.cwd();
  const securityDir = path.join(root, '.planning', 'security');
  const eventsDir = path.join(securityDir, 'events');
  const blockedDir = path.join(securityDir, 'blocked');

  // Create directory structure with secure permissions
  await ensureSecureDir(securityDir);
  await ensureSecureDir(eventsDir);
  await ensureSecureDir(blockedDir);

  // Write template files (idempotent -- skip if exists)
  await writeIfMissing(
    path.join(securityDir, 'README.md'),
    README_CONTENT,
  );

  await writeIfMissing(
    path.join(securityDir, 'schemas.json'),
    JSON.stringify(SCHEMAS_JSON, null, 2) + '\n',
  );

  await writeIfMissing(
    path.join(securityDir, 'sandbox-profile.json'),
    JSON.stringify(SANDBOX_PROFILE_TEMPLATE, null, 2) + '\n',
  );

  await writeIfMissing(
    path.join(securityDir, 'proxy-config.json'),
    JSON.stringify(PROXY_CONFIG_TEMPLATE, null, 2) + '\n',
  );

  await writeIfMissing(
    path.join(securityDir, 'domain-allowlist.json'),
    JSON.stringify(DOMAIN_ALLOWLIST_TEMPLATE, null, 2) + '\n',
  );
}

/**
 * CLI entry point for security directory initialization.
 *
 * Alias for initSecurityDirectory with identical behavior.
 *
 * @param projectRoot - Project root directory (default: process.cwd())
 */
export async function securityInitCommand(projectRoot?: string): Promise<void> {
  await initSecurityDirectory(projectRoot);
}
