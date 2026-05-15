import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { sortEnv, formatSortReport, SortOrder, SortStrategy } from '../../env/sort';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerSortCommand(program: Command): void {
  program
    .command('sort <file>')
    .description('Sort environment variable keys in a .env file')
    .option('-o, --order <order>', 'Sort order: asc or desc', 'asc')
    .option('-s, --strategy <strategy>', 'Sort strategy: alpha, length, or natural', 'alpha')
    .option('-w, --write', 'Write sorted output back to the file', false)
    .option('--dry-run', 'Preview changes without writing', false)
    .action(async (file: string, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const input = fs.readFileSync(file, 'utf-8');
      const order = opts.order as SortOrder;
      const strategy = opts.strategy as SortStrategy;

      const { output, report } = sortEnv(input, { order, strategy });
      console.log(formatSortReport(report));

      if (opts.dryRun) {
        console.log('\n--- Sorted output (dry run) ---');
        console.log(output);
        return;
      }

      if (opts.write) {
        fs.writeFileSync(file, output, 'utf-8');
        console.log(`Written sorted output to ${file}`);
      } else {
        const answer = await prompt('Write sorted output to file? (y/N): ');
        if (answer.toLowerCase() === 'y') {
          fs.writeFileSync(file, output, 'utf-8');
          console.log(`Written sorted output to ${file}`);
        } else {
          console.log('No changes written.');
        }
      }
    });
}
