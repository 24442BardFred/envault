import { Command } from 'commander';
import * as readline from 'readline';
import { loadVault, saveVault } from '../../vault/index';
import { transformEnv, formatTransformReport, getBuiltinTransformers } from '../../env/transform';
import { logAction } from '../../audit/index';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerTransformCommand(program: Command): void {
  program
    .command('transform <transformer>')
    .description('Apply a transformation to env values in the vault')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to transform (default: all)')
    .option('-p, --profile <profile>', 'Profile to use')
    .option('--list', 'List available built-in transformers')
    .option('--dry-run', 'Preview changes without saving')
    .action(async (transformer: string, opts) => {
      if (opts.list) {
        console.log('Available built-in transformers:');
        getBuiltinTransformers().forEach((t) => console.log(`  ${t}`));
        return;
      }

      const { vault, vaultPath } = await loadVault(opts.profile);
      const keys = opts.keys ? opts.keys.split(',').map((k: string) => k.trim()) : undefined;

      if (keys) {
        const missingKeys = keys.filter((k) => !(k in vault));
        if (missingKeys.length > 0) {
          console.warn(`Warning: the following keys were not found in the vault: ${missingKeys.join(', ')}`);
        }
      }

      let result;
      try {
        result = transformEnv(vault, transformer, keys);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }

      console.log(formatTransformReport(result));

      if (opts.dryRun) {
        console.log('Dry run — no changes saved.');
        return;
      }

      if (result.errors.length > 0) {
        const answer = await prompt('Some keys had errors. Save anyway? (y/N): ');
        if (answer.toLowerCase() !== 'y') {
          console.log('Aborted.');
          return;
        }
      }

      await saveVault(vaultPath, result.transformed);
      await logAction('transform', { transformer, keys: keys ?? 'all' });
      console.log('Vault updated.');
    });
}
