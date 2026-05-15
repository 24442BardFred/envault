import { Command } from "commander";
import * as fs from "fs";
import * as readline from "readline";
import { flattenEnv, expandEnv, formatFlattenReport } from "../../env/flatten";
import { parseEnv, serialiseEnv } from "../../env/parser";

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerFlattenCommand(program: Command): void {
  program
    .command("flatten <file>")
    .description("Flatten or expand env variable keys using a separator")
    .option("-s, --separator <sep>", "Key separator", "__")
    .option("-e, --expand", "Expand flat keys into nested groups instead of flattening")
    .option("-o, --output <path>", "Write result to file instead of stdout")
    .action(async (file: string, opts: { separator: string; expand?: boolean; output?: string }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const raw = fs.readFileSync(file, "utf-8");
      const env = parseEnv(raw);
      const sep = opts.separator;

      if (opts.expand) {
        const expanded = expandEnv(env, sep);
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(expanded)) {
          flat[k] = typeof v === "string" ? v : JSON.stringify(v);
        }
        const out = serialiseEnv(flat);
        if (opts.output) {
          fs.writeFileSync(opts.output, out, "utf-8");
          console.log(`Expanded env written to ${opts.output}`);
        } else {
          console.log(out);
        }
        return;
      }

      const nested: Record<string, Record<string, string> | string> = {};
      for (const [k, v] of Object.entries(env)) {
        nested[k] = v;
      }

      const flattened = flattenEnv(nested, sep);
      const report = {
        original: env,
        flattened,
        separator: sep,
        count: Object.keys(flattened).length,
      };

      const out = serialiseEnv(flattened);
      if (opts.output) {
        fs.writeFileSync(opts.output, out, "utf-8");
        console.log(formatFlattenReport(report));
        console.log(`\nWritten to ${opts.output}`);
      } else {
        console.log(formatFlattenReport(report));
      }
    });
}
