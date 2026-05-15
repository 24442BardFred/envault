import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { castEnv, formatCastReport, CastRule, CastType } from '../../env/cast';
import { parseEnv } from '../../env/parser';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerCastCommand(program: Command): void {
  program
    .command('cast <file>')
    .description('Cast env variable values to typed primitives (number, boolean, json, string)')
    .option('-r, --rule <entries...>', 'Cast rules in KEY:TYPE format, e.g. PORT:number DEBUG:boolean')
    .option('--json', 'Output casted env as JSON')
    .option('--report', 'Show cast report only')
    .action(async (file: string, options: { rule?: string[]; json?: boolean; report?: boolean }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const raw = fs.readFileSync(file, 'utf-8');
      const env = parseEnv(raw);

      let rules: CastRule[] = [];

      if (options.rule && options.rule.length > 0) {
        rules = options.rule.map(entry => {
          const [key, type] = entry.split(':');
          if (!key || !type) {
            console.error(`Invalid rule format: "${entry}". Expected KEY:TYPE`);
            process.exit(1);
          }
          return { key, type: type as CastType };
        });
      } else {
        console.log('No rules provided. Enter rules interactively (empty key to finish):');
        while (true) {
          const key = await prompt('  Key (or Enter to finish): ');
          if (!key) break;
          const type = (await prompt('  Type (string/number/boolean/json): ')) as CastType;
          rules.push({ key, type });
        }
      }

      const { casted, report } = castEnv(env, rules);

      if (report.errors.length > 0) {
        console.warn('Cast warnings:');
        console.warn(formatCastReport({ results: report.errors, errors: report.errors }));
      }

      if (options.report) {
        console.log(formatCastReport(report));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(casted, null, 2));
      } else {
        console.log(formatCastReport(report));
      }
    });
}
