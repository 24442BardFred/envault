import { Command } from 'commander';
import * as readline from 'readline';
import { loadVault } from '../../vault/index';
import { filterEnv, formatFilterReport } from '../../env/filter';
import { parseEnv } from '../../env/parser';
import * as fs from 'fs';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerFilterCommand(program: Command): void {
  program
    .command('filter')
    .description('Filter env entries from vault or a .env file')
    .option('-k, --key <pattern>', 'Regex pattern to match keys')
    .option('-v, --value <pattern>', 'Regex pattern to match values')
    .option('-p, --prefix <prefix>', 'Key prefix to filter by')
    .option('-i, --invert', 'Invert the filter (exclude matches)', false)
    .option('-f, --file <path>', 'Filter a .env file instead of vault')
    .option('--password <password>', 'Vault password (skips prompt)')
    .action(async (opts) => {
      try {
        let env: Record<string, string>;

        if (opts.file) {
          if (!fs.existsSync(opts.file)) {
            console.error(`File not found: ${opts.file}`);
            process.exit(1);
          }
          const raw = fs.readFileSync(opts.file, 'utf-8');
          env = parseEnv(raw);
        } else {
          const password = opts.password ?? await prompt('Vault password: ');
          const vault = await loadVault(password);
          env = vault;
        }

        const report = filterEnv(env, {
          keyPattern: opts.key,
          valuePattern: opts.value,
          prefix: opts.prefix,
          invert: opts.invert,
        });

        console.log(formatFilterReport(report));
      } catch (err: any) {
        console.error('Filter failed:', err.message);
        process.exit(1);
      }
    });
}
