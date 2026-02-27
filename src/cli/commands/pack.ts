import pc from "picocolors";
import { PackCatalog } from "../../fs/pack-catalog.js";

export async function packCommand(args: string[]): Promise<number> {
  const root = process.cwd();
  const catalog = new PackCatalog(root);
  const sub = args[0];

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc pack <command>\n");
    console.log("Commands:");
    console.log("  list          List available packs");
    console.log("  info <name>   Show pack details");
    return sub ? 0 : 1;
  }

  switch (sub) {
    case "list": {
      const packs = await catalog.list();
      if (packs.length === 0) {
        console.log("No packs found.");
        return 0;
      }
      console.log(pc.bold("PACK".padEnd(16) + "MODULES".padEnd(10) + "DESCRIPTION"));
      for (const p of packs) {
        console.log(p.name.padEnd(16) + String(p.moduleCount).padEnd(10) + p.description);
      }
      return 0;
    }
    case "info": {
      const name = args[1];
      if (!name) {
        console.error(pc.red("Error: pack name required"));
        return 1;
      }
      const pack = await catalog.info(name);
      if (!pack) {
        console.error(pc.red(`Unknown pack: '${name}'. Run 'sc pack list' to see available packs.`));
        return 1;
      }
      console.log(`Pack: ${pc.bold(pack.name)}`);
      console.log(`Source: ${pc.dim(pack.sourcePath)}`);
      console.log(`Modules: ${pack.moduleCount}`);
      console.log(`Description: ${pack.description}`);
      return 0;
    }
    default:
      console.error(pc.red(`Unknown pack command: ${sub}`));
      return 1;
  }
}
