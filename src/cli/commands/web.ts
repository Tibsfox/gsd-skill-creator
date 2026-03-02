/**
 * CLI subcommand handler for web automation.
 *
 * Thin wrapper over src/web-automation/ module following
 * the curl.ts pattern. Maps CLI flags to domain functions
 * and formats output with picocolors.
 */

import pc from 'picocolors';
import { readFileSync } from 'node:fs';

function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

async function webScrapeCommand(subArgs: string[]): Promise<number> {
  const positional = subArgs.filter((a) => !a.startsWith('--'));
  const url = positional[0];

  if (!url) {
    console.log(pc.red('Error: URL is required'));
    console.log(pc.dim('Usage: sc web scrape [options] <url>'));
    return 1;
  }

  const selectValue = extractFlag(subArgs, 'select') ?? 'body';
  const rate = parseInt(extractFlag(subArgs, 'rate') ?? '2', 10);

  const { WebRateLimiter } = await import('../../web-automation/rate-limiter.js');
  const { WebScraper } = await import('../../web-automation/scraper.js');

  const limiter = new WebRateLimiter({ requestsPerSecond: rate });
  const scraper = new WebScraper(limiter);

  const result = await scraper.scrape({
    url,
    selectors: { result: { css: selectValue } },
  });

  if (result.success) {
    console.log(pc.green(`${result.statusCode} OK`));
    const data = result.data?.result;
    if (Array.isArray(data)) {
      for (const item of data) {
        console.log(item);
      }
    } else if (data) {
      console.log(data);
    }
    return 0;
  }

  console.log(pc.red(`Error: ${result.error ?? 'scrape failed'}`));
  return 1;
}

async function webChainCommand(subArgs: string[]): Promise<number> {
  const positional = subArgs.filter((a) => !a.startsWith('--'));
  const chainFile = extractFlag(subArgs, 'chain') ?? positional[0];

  if (!chainFile) {
    console.log(pc.red('Error: chain file is required'));
    console.log(pc.dim('Usage: sc web chain [options] <file.yaml>'));
    return 1;
  }

  const rate = parseInt(extractFlag(subArgs, 'rate') ?? '2', 10);

  const { WebRateLimiter } = await import('../../web-automation/rate-limiter.js');
  const { WebChainRunner, loadChainConfig } = await import('../../web-automation/chain.js');

  const yamlContent = readFileSync(chainFile, 'utf-8');
  const config = loadChainConfig(yamlContent);

  const limiter = new WebRateLimiter({ requestsPerSecond: rate });
  const runner = new WebChainRunner(limiter);
  const result = await runner.run(config);

  console.log(pc.bold(`Chain: ${result.chainName}`));
  for (const step of result.steps) {
    const icon = step.passed ? pc.green('PASS') : pc.red('FAIL');
    console.log(`  ${icon} ${step.stepName} — ${step.statusCode}`);
    if (step.error) {
      console.log(pc.red(`    Error: ${step.error}`));
    }
  }

  return result.passed ? 0 : 1;
}

async function webApiTestCommand(subArgs: string[]): Promise<number> {
  const positional = subArgs.filter((a) => !a.startsWith('--'));
  const chainFile = extractFlag(subArgs, 'chain') ?? positional[0];

  if (!chainFile) {
    console.log(pc.red('Error: chain file is required'));
    console.log(pc.dim('Usage: sc web api-test [options] <file.yaml>'));
    return 1;
  }

  const rate = parseInt(extractFlag(subArgs, 'rate') ?? '2', 10);

  const { WebRateLimiter } = await import('../../web-automation/rate-limiter.js');
  const { WebChainRunner, loadChainConfig } = await import('../../web-automation/chain.js');

  const yamlContent = readFileSync(chainFile, 'utf-8');
  const config = loadChainConfig(yamlContent);

  const limiter = new WebRateLimiter({ requestsPerSecond: rate });
  const runner = new WebChainRunner(limiter);
  const result = await runner.run(config);

  console.log(pc.bold(`API Test: ${result.chainName}`));
  for (const step of result.steps) {
    console.log(`\n  ${pc.bold(step.stepName)} (${step.statusCode})`);
    for (const a of step.assertions) {
      const icon = a.passed ? pc.green('PASS') : pc.red('FAIL');
      console.log(`    ${icon} ${a.rule.type}: expected=${a.expected} actual=${a.actual}`);
    }
    if (step.error) {
      console.log(pc.red(`    Error: ${step.error}`));
    }
  }

  const summaryColor = result.passed ? pc.green : pc.red;
  console.log(`\n${summaryColor(`${result.passedAssertions}/${result.totalAssertions} assertions passed`)}`);

  return result.passed ? 0 : 1;
}

function showWebHelp(): void {
  console.log(`Usage: sc web <command> [options]

Commands:
  scrape, s      Scrape a URL with CSS selectors
  chain, c       Run a YAML request chain
  api-test, t    Run a chain with assertion output

Options:
  --select=CSS   CSS selector for scrape (default: body)
  --rate=N       Requests per second (default: 2)
  --chain=FILE   Chain YAML file path
  --help         Show this help

Examples:
  sc web scrape --select=h1 https://example.com
  sc web chain workflow.yaml
  sc web api-test --rate=5 tests.yaml`);
}

export async function webCommand(args: string[]): Promise<number> {
  if (args.length === 0 || hasFlag(args, 'help')) {
    showWebHelp();
    return 0;
  }

  switch (args[0]) {
    case 'scrape':
    case 's':
      return webScrapeCommand(args.slice(1));
    case 'chain':
    case 'c':
      return webChainCommand(args.slice(1));
    case 'api-test':
    case 't':
      return webApiTestCommand(args.slice(1));
    default:
      console.log(pc.red(`Unknown command: ${args[0]}`));
      showWebHelp();
      return 1;
  }
}
