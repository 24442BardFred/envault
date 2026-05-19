import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { parseEnv, serialiseEnv } from '../../env/parser';
import { trimEnv, formatTrimReport } from '../../env/trim';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

export function registerTrimCommand(program: Command): void {
  program
    .command('trim <file>')
    .description('Trim whitespace (and optionally quotes) from .env values')
    .option('-q, --strip-quotes', 'Also strip surrounding quote characters from values')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to trim (trims all if omitted)')
    .option('-o, --output <path>', 'Write result to a file instead of overwriting the source')
    .option('--dry-run', 'Preview changes without writing to disk')
    .action(async (file: string, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const raw = fs.readFileSync(file, 'utf8');
      const env = parseEnv(raw);

      const keys = opts.keys
        ? (opts.keys as string).split(',').map((k: string) => k.trim()).filter(Boolean)
        : undefined;

      const { result, report } = trimEnv(env, {
        stripQuotes: !!opts.stripQuotes,
        keys,
      });

      console.log(formatTrimReport(report));

      if (opts.dryRun) {
        console.log('\nDry run — no files written.');
        return;
      }

      const trimmedCount = Object.keys(report.trimmed).length;
      if (trimmedCount === 0) {
        console.log('Nothing to write.');
        return;
      }

      const destination = opts.output || file;

      if (!opts.output && !opts.dryRun) {
        const answer = await prompt(`Overwrite ${file}? (y/N) `);
        if (answer.toLowerCase() !== 'y') {
          console.log('Aborted.');
          return;
        }
      }

      fs.writeFileSync(destination, serialiseEnv(result), 'utf8');
      console.log(`Written to ${destination}`);
    });
}
