/**
 * CLI subcommand handler for curl HTTP requests.
 *
 * Thin wrapper over src/curl/ module following the site.ts pattern.
 * Maps CLI flags to CurlRequest/CurlRequestOptions types and
 * formats response output with picocolors.
 */

import pc from 'picocolors';
import type { CurlMethod } from '../../curl/types.js';

function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function extractAllFlags(args: string[], flag: string): string[] {
  const prefix = `--${flag}=`;
  return args.filter((a) => a.startsWith(prefix)).map((a) => a.slice(prefix.length));
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

async function curlRequestCommand(args: string[]): Promise<number> {
  // Extract URL: filter out all --flag and --flag=value args
  const positional = args.filter((a) => !a.startsWith('--'));
  const url = positional[0];

  if (!url) {
    console.log(pc.red('Error: URL is required'));
    console.log(pc.dim('Usage: sc curl [options] <url>'));
    return 1;
  }

  const { httpRequest } = await import('../../curl/client.js');
  const method = (extractFlag(args, 'method') ?? 'GET').toUpperCase() as CurlMethod;
  const data = extractFlag(args, 'data');
  const verbose = hasFlag(args, 'verbose');
  const headerValues = extractAllFlags(args, 'header');
  const user = extractFlag(args, 'user');
  const bearer = extractFlag(args, 'bearer');
  const cookieJarPath = extractFlag(args, 'cookie-jar');
  const proxyUrl = extractFlag(args, 'proxy');
  const insecure = hasFlag(args, 'insecure');

  // Build headers from --header=Key:Value flags
  const headers: Record<string, string> = {};
  for (const h of headerValues) {
    const colonIdx = h.indexOf(':');
    if (colonIdx > 0) {
      headers[h.slice(0, colonIdx).trim()] = h.slice(colonIdx + 1).trim();
    }
  }

  // Build auth config
  const auth = user
    ? { type: 'basic' as const, username: user.split(':')[0], password: user.split(':').slice(1).join(':') }
    : bearer
      ? { type: 'bearer' as const, token: bearer }
      : undefined;

  // Build request options
  const opts: Record<string, unknown> = {};
  if (cookieJarPath) {
    const { CurlCookieJar } = await import('../../curl/cookies.js');
    const jar = new CurlCookieJar();
    try { jar.load(cookieJarPath); } catch { /* empty jar */ }
    opts.cookieJar = jar;
  }
  if (proxyUrl) {
    opts.proxy = { url: proxyUrl };
  }
  if (insecure) {
    opts.cert = { rejectUnauthorized: false };
  }

  const requestOpts = Object.keys(opts).length > 0 ? opts : undefined;

  const result = await httpRequest(
    { url, method, headers, body: data, auth, debug: verbose },
    requestOpts as Parameters<typeof httpRequest>[1],
  );

  // Format output
  if (result.blocked) {
    console.log(pc.red(`BLOCKED: ${result.blockReason}`));
    return 1;
  }

  const statusColor = result.status < 300 ? pc.green : result.status < 400 ? pc.yellow : pc.red;
  console.log(statusColor(`${result.status} ${result.statusText}`));

  if (verbose && result.debug) {
    console.log(pc.dim('\n--- Request Headers ---'));
    for (const [k, v] of Object.entries(result.debug.requestHeaders)) {
      console.log(pc.dim(`  ${k}: ${v}`));
    }
    console.log(pc.dim('\n--- Response Headers ---'));
    for (const [k, v] of Object.entries(result.debug.responseHeaders)) {
      console.log(pc.dim(`  ${k}: ${v}`));
    }
    console.log('');
  }

  if (result.body) {
    console.log(result.body);
  }

  return 0;
}

function showCurlHelp(): void {
  console.log(`Usage: sc curl [options] <url>

Options:
  --method=METHOD    HTTP method (default: GET)
  --header=K:V       Add header (repeatable)
  --data=BODY        Request body
  --user=USER:PASS   Basic authentication
  --bearer=TOKEN     Bearer token authentication
  --cookie-jar=FILE  Netscape cookie jar file path
  --proxy=URL        Proxy URL (http:// or socks5://)
  --insecure         Skip TLS verification
  --verbose          Show request/response headers`);
}

export async function curlCommand(args: string[]): Promise<number> {
  if (args.length === 0 || hasFlag(args, 'help')) {
    showCurlHelp();
    return 0;
  }
  return curlRequestCommand(args);
}
