/**
 * pack command -- explore knowledge packs in the packs/ zone.
 *
 * Usage:
 *   sc pack list             List available packs
 *   sc pack info <name>      Show details for a specific pack
 *   sc pack status           Show pack summary
 */

import { PackCatalog } from "../pack-catalog.js";

/**
 * Execute the pack subcommand.
 *
 * @param args - Arguments after "pack" (e.g., ["list"])
 * @param root - Project root (defaults to process.cwd())
 * @returns Exit code (0 for success, 1 for error)
 */
export async function packCommand(args: string[], root?: string): Promise<number> {
  const cwd = root ?? process.cwd();
  const [sub, ...rest] = args;

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc pack <list|info|status> [name]");
    return 0;
  }

  try {
    const catalog = new PackCatalog(cwd);

    switch (sub) {
      case "list": {
        const packs = await catalog.list();
        if (packs.length === 0) {
          console.log("No packs available");
        } else {
          for (const p of packs) {
            console.log(`  ${p.name}  ${p.description}  (${p.moduleCount} modules)`);
          }
        }
        return 0;
      }

      case "info": {
        const name = rest[0];
        if (!name) {
          console.error("Error: pack name is required");
          return 1;
        }
        const descriptor = await catalog.info(name);
        if (!descriptor) {
          console.error(`Error: pack '${name}' not found`);
          return 1;
        }
        console.log(`Pack: ${descriptor.name}`);
        console.log(`Description: ${descriptor.description}`);
        console.log(`Source: ${descriptor.sourcePath}`);
        console.log(`Modules: ${descriptor.moduleCount}`);
        return 0;
      }

      case "status": {
        const summary = await catalog.status();
        console.log(summary);
        return 0;
      }

      default:
        console.error(`Error: unknown pack subcommand '${sub}'`);
        return 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    return 1;
  }
}
