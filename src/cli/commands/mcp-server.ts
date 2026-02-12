/**
 * CLI command for starting the MCP server.
 *
 * Delegates to startMcpServer which runs on stdio transport.
 * CRITICAL: The server communicates via stdout -- all logging must use stderr.
 */

import { startMcpServer } from '../../mcp/index.js';
import { getSkillsBasePath, parseScope } from '../../types/scope.js';

/**
 * Start the MCP server for skill browsing and installation.
 *
 * @param args - Command-line arguments (after 'mcp-server')
 * @returns Exit code (0 on clean shutdown, 1 on error)
 */
export async function mcpServerCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showMcpServerHelp();
    return 0;
  }

  // Parse scope from args
  const scope = args.includes('--project') || args.includes('-p')
    ? 'project' as const
    : 'user' as const;

  const skillsDir = getSkillsBasePath(scope);

  try {
    await startMcpServer(skillsDir);
    return 0;
  } catch (err) {
    // CRITICAL: Use stderr, not stdout (stdout is MCP protocol)
    console.error(
      `MCP server error: ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }
}

function showMcpServerHelp(): void {
  console.log(`
skill-creator mcp-server - Start MCP server for skill browsing and installation

Usage:
  skill-creator mcp-server [options]

Options:
  --project, -p   Serve project-level skills (default: user-level)
  --help, -h      Show this help message

The server communicates via stdio (stdin/stdout) using the MCP protocol.
Configure your MCP client to launch: skill-creator mcp-server
`);
}
