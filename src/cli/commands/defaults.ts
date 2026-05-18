import { Command } from 'commander';
import * as readline from 'readline';
import * as fs from 'fs';
import { parseEnv, serialiseEnv } from '../../env/parser';
import { applyDefaults, formatDefaultsReport } from '../../env/defaults';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerDefaultsCommand(program: Command): void {
  program
    .command('defaults <envFile>')
    .description('Apply default values to a .env file for missing or empty keys')
    .option('-d, --defaults <file>', 'Path to a .env file containing default values')
    .option('--no-overwrite-empty', 'Do not overwrite keys that exist but are empty')
    .option('-o, --output <file>', 'Write result to file instead of stdout')
    .option('--dry-run', 'Preview changes without writing')
    .action(async (envFile: string, opts) => {
      try {
        const envRaw = fs.readFileSync(envFile, 'utf-8');
        const env = parseEnv(envRaw);

        let defaultsFile: string = opts.defaults;
        if (!defaultsFile) {
          defaultsFile = await prompt('Path to defaults file: ');
        }

        const defaultsRaw = fs.readFileSync(defaultsFile, 'utf-8');
        const defaults = parseEnv(defaultsRaw);

        const overwriteEmpty: boolean = opts.overwriteEmpty !== false;
        const { result, report } = applyDefaults(env, defaults, overwriteEmpty);

        console.log(formatDefaultsReport(report));

        if (opts.dryRun) {
          console.log('\n[dry-run] No files written.');
          return;
        }

        const serialised = serialiseEnv(result);
        const outPath: string = opts.output || envFile;
        fs.writeFileSync(outPath, serialised, 'utf-8');
        console.log(`\nWritten to ${outPath}`);
      } catch (err: any) {
        console.error('defaults error:', err.message);
        process.exit(1);
      }
    });
}
