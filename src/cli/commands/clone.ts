import { Command } from 'commander';
import * as readline from 'readline';
import * as fs from 'fs';
import { parseEnv, serialiseEnv } from '../../env/parser';
import { cloneEnv, formatCloneReport } from '../../env/clone';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerCloneCommand(program: Command): void {
  program
    .command('clone <input>')
    .description('Clone env keys with a new prefix or suffix')
    .option('-o, --output <file>', 'Output file (defaults to overwriting input)')
    .option('-p, --prefix <prefix>', 'Prefix to add to cloned keys', '')
    .option('-s, --suffix <suffix>', 'Suffix to add to cloned keys', '')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to clone (default: all)')
    .option('--overwrite', 'Overwrite existing destination keys', false)
    .option('--dry-run', 'Preview changes without writing', false)
    .action(async (input: string, opts) => {
      if (!fs.existsSync(input)) {
        console.error(`File not found: ${input}`);
        process.exit(1);
      }

      if (!opts.prefix && !opts.suffix) {
        console.error('At least one of --prefix or --suffix must be provided.');
        process.exit(1);
      }

      const raw = fs.readFileSync(input, 'utf-8');
      const env = parseEnv(raw);

      const keys = opts.keys
        ? opts.keys.split(',').map((k: string) => k.trim()).filter(Boolean)
        : undefined;

      const { result, report } = cloneEnv(env, {
        prefix: opts.prefix,
        suffix: opts.suffix,
        overwrite: opts.overwrite,
        keys,
      });

      console.log(formatCloneReport(report));

      if (opts.dryRun) {
        console.log('\n[dry-run] No changes written.');
        return;
      }

      const outputPath = opts.output ?? input;
      fs.writeFileSync(outputPath, serialiseEnv(result), 'utf-8');
      console.log(`\nWritten to ${outputPath}`);
    });
}
