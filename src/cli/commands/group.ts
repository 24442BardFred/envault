import { Command } from 'commander';
import * as readline from 'readline';
import * as fs from 'fs';
import { parseEnv, serialiseEnv } from '../../env/parser';
import { groupEnv, formatGroupReport } from '../../env/group';

export const prompt = (q: string): Promise<string> =>
  new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, answer => { rl.close(); resolve(answer.trim()); });
  });

export function registerGroupCommand(program: Command): void {
  program
    .command('group')
    .description('Group environment variables by key prefix')
    .option('-f, --file <path>', 'Path to .env file', '.env')
    .option('-d, --delimiter <char>', 'Delimiter used to detect prefix', '_')
    .option('-o, --output <path>', 'Write grouped output to file (optional)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const filePath: string = opts.file;
      const delimiter: string = opts.delimiter;

      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const env = parseEnv(raw);
      const report = groupEnv(env, delimiter);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      const formatted = formatGroupReport(report);
      console.log(formatted);

      if (opts.output) {
        // Write each group as a block separated by comments
        const lines: string[] = [];
        for (const [prefix, vars] of Object.entries(report.groups)) {
          lines.push(`# ${prefix}`);
          lines.push(serialiseEnv(vars));
          lines.push('');
        }
        if (report.ungrouped.length > 0) {
          lines.push('# (ungrouped)');
          const ungroupedEnv = Object.fromEntries(
            report.ungrouped.map(k => [k, env[k]])
          );
          lines.push(serialiseEnv(ungroupedEnv));
        }
        fs.writeFileSync(opts.output, lines.join('\n'), 'utf-8');
        console.log(`Grouped output written to ${opts.output}`);
      }
    });
}
