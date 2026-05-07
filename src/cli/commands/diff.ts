import * as path from 'path';
import * as readline from 'readline';
import type { Argv } from 'yargs';
import { openVault } from '../../vault';
import { diffFiles, diffAgainstVault } from '../../diff';
import { resolveVaultPath } from '../../profile';
import { logAction } from '../../audit';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerDiffCommand(yargs: Argv): Argv {
  return yargs.command(
    'diff [fileA] [fileB]',
    'Show differences between two .env files or between a file and the vault',
    (y) =>
      y
        .positional('fileA', {
          describe: 'First .env file (or omit to compare vault vs local .env)',
          type: 'string',
        })
        .positional('fileB', {
          describe: 'Second .env file',
          type: 'string',
        })
        .option('vault', {
          alias: 'v',
          describe: 'Compare vault contents against fileA (treated as local .env)',
          type: 'boolean',
          default: false,
        }),
    async (argv) => {
      try {
        if (argv.vault) {
          const envPath = argv.fileA ?? '.env';
          const vaultPath = resolveVaultPath();
          const password = await prompt('Vault password: ');
          const vault = await openVault(vaultPath, password);
          const output = diffAgainstVault(envPath, vault.data);
          if (!output) {
            console.log('No differences found between vault and local .env.');
          } else {
            console.log(output);
          }
          await logAction('diff', { mode: 'vault-vs-file', envPath });
        } else {
          const fileA = argv.fileA ?? '.env';
          const fileB = argv.fileB;
          if (!fileB) {
            console.error('Error: provide two files to compare, or use --vault flag.');
            process.exit(1);
          }
          const output = diffFiles(fileA, fileB);
          if (!output) {
            console.log('No differences found.');
          } else {
            console.log(output);
          }
          await logAction('diff', { mode: 'file-vs-file', fileA, fileB });
        }
      } catch (err: any) {
        console.error(`diff error: ${err.message}`);
        process.exit(1);
      }
    }
  );
}
