import type { Argv } from 'yargs';
import * as readline from 'readline';
import { createBackup, listBackups, restoreBackup, deleteBackup } from '../../backup/backup';
import { defaultVaultPath } from '../../vault/index';
import { logAction } from '../../audit/index';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerBackupCommand(yargs: Argv): void {
  yargs.command(
    'backup <action>',
    'Manage vault backups',
    (y) =>
      y
        .positional('action', {
          describe: 'Action: create | list | restore | delete',
          type: 'string',
          choices: ['create', 'list', 'restore', 'delete'],
        })
        .option('backup-path', {
          alias: 'b',
          type: 'string',
          description: 'Path to a specific backup file (for restore/delete)',
        }),
    async (argv) => {
      const action = argv.action as string;

      if (action === 'create') {
        try {
          const meta = createBackup(defaultVaultPath);
          console.log(`✅ Backup created: ${meta.backupPath}`);
          await logAction('backup-create', { backupPath: meta.backupPath });
        } catch (err: any) {
          console.error(`❌ ${err.message}`);
          process.exit(1);
        }
      } else if (action === 'list') {
        const backups = listBackups();
        if (backups.length === 0) {
          console.log('No backups found.');
        } else {
          console.log('Available backups:');
          backups.forEach((b, i) => console.log(`  [${i + 1}] ${b.backupPath}`));
        }
      } else if (action === 'restore') {
        const bPath = (argv['backup-path'] as string) || (await prompt('Backup file path: '));
        try {
          restoreBackup(bPath, defaultVaultPath);
          console.log(`✅ Vault restored from: ${bPath}`);
          await logAction('backup-restore', { backupPath: bPath });
        } catch (err: any) {
          console.error(`❌ ${err.message}`);
          process.exit(1);
        }
      } else if (action === 'delete') {
        const bPath = (argv['backup-path'] as string) || (await prompt('Backup file path to delete: '));
        const confirm = await prompt(`Delete backup "${bPath}"? (yes/no): `);
        if (confirm.toLowerCase() !== 'yes') {
          console.log('Aborted.');
          return;
        }
        try {
          deleteBackup(bPath);
          console.log(`🗑️  Backup deleted: ${bPath}`);
          await logAction('backup-delete', { backupPath: bPath });
        } catch (err: any) {
          console.error(`❌ ${err.message}`);
          process.exit(1);
        }
      }
    }
  );
}
