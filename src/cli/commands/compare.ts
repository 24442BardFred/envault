import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { parseEnv } from '../../env/parser';
import { compareEnv, formatCompareReport } from '../../env/compare';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerCompareCommand(program: Command): void {
  program
    .command('compare <baseFile> <targetFile>')
    .description('Compare two .env files and report differences')
    .option('--show-unchanged', 'Also display keys that are identical in both files', false)
    .option('--json', 'Output the result as JSON', false)
    .action(async (baseFile: string, targetFile: string, opts: { showUnchanged: boolean; json: boolean }) => {
      if (!fs.existsSync(baseFile)) {
        console.error(`Error: base file not found: ${baseFile}`);
        process.exit(1);
      }
      if (!fs.existsSync(targetFile)) {
        console.error(`Error: target file not found: ${targetFile}`);
        process.exit(1);
      }

      const baseRaw = fs.readFileSync(baseFile, 'utf8');
      const targetRaw = fs.readFileSync(targetFile, 'utf8');

      let base: Record<string, string>;
      let target: Record<string, string>;

      try {
        base = parseEnv(baseRaw);
      } catch {
        console.error(`Error: failed to parse base file: ${baseFile}`);
        process.exit(1);
      }

      try {
        target = parseEnv(targetRaw);
      } catch {
        console.error(`Error: failed to parse target file: ${targetFile}`);
        process.exit(1);
      }

      const report = compareEnv(base, target);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(`Comparing ${baseFile} → ${targetFile}\n`);
        console.log(formatCompareReport(report, opts.showUnchanged));
      }

      if (report.changed > 0 || report.added > 0 || report.removed > 0) {
        process.exit(1);
      }
    });
}
