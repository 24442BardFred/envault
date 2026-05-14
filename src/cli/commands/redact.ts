import { Command } from 'commander';
import * as readline from 'readline';
import { redactEnv, formatRedactReport } from '../../env/redact';
import { loadVault } from '../../vault';
import { resolveVaultPath } from '../../profile';
import { logAction } from '../../audit';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

export function registerRedactCommand(program: Command): void {
  program
    .command('redact')
    .description('Display vault env vars with sensitive values redacted')
    .option('-p, --profile <profile>', 'Profile to use')
    .option('--show-keys', 'Show which keys were redacted')
    .option('--pattern <pattern>', 'Additional pattern to treat as sensitive (regex)')
    .action(async (opts) => {
      try {
        const vaultPath = resolveVaultPath(opts.profile);
        const masterPassword = await prompt('Master password: ');
        const env = await loadVault(vaultPath, masterPassword);

        const extraPatterns: RegExp[] = [];
        if (opts.pattern) {
          try {
            extraPatterns.push(new RegExp(opts.pattern, 'i'));
          } catch {
            console.error(`Invalid regex pattern: ${opts.pattern}`);
            process.exit(1);
          }
        }

        const result = redactEnv(env, extraPatterns);
        const report = formatRedactReport(result);
        console.log(report);

        if (opts.showKeys && result.redacted.length > 0) {
          console.log(`\nRedacted keys (${result.redacted.length}): ${result.redacted.join(', ')}`);
        }

        await logAction('redact', { profile: opts.profile ?? 'default', redactedCount: result.redacted.length });
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
