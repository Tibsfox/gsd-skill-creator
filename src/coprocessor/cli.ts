/**
 * CLI wiring for `skill-creator coprocessor <subcommand>`.
 *
 * Subcommands:
 *   list-tools          List the 19 MCP tools exposed by the coprocessor
 *   capabilities        Report GPU availability, chip status, VRAM budget
 *   vram                Print the live VRAM report
 *   call <tool> <json>  Invoke a tool with a JSON argument object
 *
 * @module coprocessor/cli
 */

import { CoprocessorClient } from './client.js';
import type { ToolName } from './types.js';

export async function runCoprocessorCli(args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  if (!sub || sub === 'help' || sub === '--help' || sub === '-h') {
    printHelp();
    return 0;
  }

  const client = new CoprocessorClient();
  try {
    await client.connect();
    switch (sub) {
      case 'list-tools':
        return await listTools(client);
      case 'capabilities':
        return await capabilities(client);
      case 'vram':
        return await vram(client);
      case 'call':
        return await call(client, rest);
      default:
        console.error(`Unknown subcommand: ${sub}`);
        printHelp();
        return 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Coprocessor CLI error: ${message}`);
    return 1;
  } finally {
    await client.disconnect().catch(() => undefined);
  }
}

function printHelp(): void {
  process.stdout.write(
    [
      'skill-creator coprocessor <subcommand>',
      '',
      'Subcommands:',
      '  list-tools              List tools exposed by the coprocessor MCP server',
      '  capabilities            GPU availability, chip status, VRAM budget',
      '  vram                    Live VRAM report',
      '  call <tool> <json>      Invoke a tool, e.g.',
      '                          skill-creator coprocessor call algebrus.gemm \\',
      '                            \'{"a":[[1,2],[3,4]],"b":[[5,6],[7,8]]}\'',
      '',
    ].join('\n') + '\n',
  );
}

async function listTools(client: CoprocessorClient): Promise<number> {
  const caps = await client.capabilities();
  for (const [chip, info] of Object.entries(caps.value.chips)) {
    process.stdout.write(`[${chip}] enabled=${info.enabled}\n`);
    for (const op of info.gpu_ops) process.stdout.write(`    ${chip}.${op}  (gpu)\n`);
    for (const op of info.cpu_ops) process.stdout.write(`    ${chip}.${op}  (cpu-only)\n`);
  }
  return 0;
}

async function capabilities(client: CoprocessorClient): Promise<number> {
  const caps = await client.capabilities();
  process.stdout.write(JSON.stringify(caps.value, null, 2) + '\n');
  return 0;
}

async function vram(client: CoprocessorClient): Promise<number> {
  const report = await client.vram();
  process.stdout.write(JSON.stringify(report.value, null, 2) + '\n');
  return 0;
}

async function call(client: CoprocessorClient, rest: string[]): Promise<number> {
  const [tool, jsonArg] = rest;
  if (!tool) {
    console.error('Usage: skill-creator coprocessor call <tool> <json-args>');
    return 1;
  }
  let parsedArgs: Record<string, unknown> = {};
  if (jsonArg) {
    try {
      parsedArgs = JSON.parse(jsonArg);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Invalid JSON for args: ${message}`);
      return 1;
    }
  }
  const result = await client.callTool(tool as ToolName, parsedArgs);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  return 0;
}
