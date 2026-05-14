import { Command } from 'commander';
import * as readline from 'readline';
import { loadVault, saveVault } from '../../vault';
import { renameEnv, formatRenameReport, RenameEntry } from '../../env/rename';
import { logAction } from '../../audit';
import { resolveVaultPath } from '../../profile';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <from> <to>')
    .description('Rename an environment variable key in the vault')
    .option('-p, --profile <profile>', 'Profile to use')
    .option('--bulk <pairs>', 'Comma-separated list of from:to pairs (e.g. OLD:NEW,FOO:BAR)')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (from: string, to: string, opts: { profile?: string; bulk?: string; yes?: boolean }) => {
      try {
        const vaultPath = resolveVaultPath(opts.profile);
        const password = await prompt('Vault password: ');
        const vault = await loadVault(vaultPath, password);

        let renames: RenameEntry[] = [{ from, to }];

        if (opts.bulk) {
          renames = opts.bulk.split(',').map(pair => {
            const [f, t] = pair.split(':');
            if (!f || !t) throw new Error(`Invalid pair: "${pair}" — expected format OLD:NEW`);
            return { from: f.trim(), to: t.trim() };
          });
        }

        if (!opts.yes) {
          const summary = renames.map(r => `  ${r.from} → ${r.to}`).join('\n');
          const confirm = await prompt(`Rename the following keys?\n${summary}\n[y/N] `);
          if (confirm.toLowerCase() !== 'y') {
            console.log('Aborted.');
            return;
          }
        }

        const { env: updated, result } = renameEnv(vault, renames);
        await saveVault(vaultPath, password, updated);
        await logAction('rename', { renames: result.renamed });

        console.log(formatRenameReport(result));
        if (result.renamed.length) {
          console.log(`\n✔ ${result.renamed.length} key(s) renamed.`);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
