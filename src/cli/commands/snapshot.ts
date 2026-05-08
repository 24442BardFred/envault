import type { Argv } from 'yargs';
import * as readline from 'readline';
import { getSnapshotPath, createSnapshot, listSnapshots, getSnapshot, deleteSnapshot } from '../../snapshot';
import { defaultVaultPath } from '../../vault';
import { readEnvFile } from '../../env';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerSnapshotCommand(yargs: Argv): Argv {
  return yargs.command(
    'snapshot <action>',
    'Manage env snapshots (save | list | restore | delete)',
    (y) =>
      y
        .positional('action', { type: 'string', choices: ['save', 'list', 'restore', 'delete'], demandOption: true })
        .option('label', { type: 'string', description: 'Label for the snapshot', alias: 'l' })
        .option('id', { type: 'string', description: 'Snapshot ID (or prefix)', alias: 'i' })
        .option('vault', { type: 'string', description: 'Path to vault file', default: defaultVaultPath }),
    async (argv) => {
      const snapshotPath = getSnapshotPath(process.cwd());

      if (argv.action === 'save') {
        const password = await prompt('Vault password: ');
        const data = await readEnvFile(argv.vault as string, password);
        const label = (argv.label as string | undefined) || (await prompt('Snapshot label: '));
        const snap = createSnapshot(snapshotPath, data, label);
        console.log(`Snapshot saved: ${snap.id.slice(0, 8)} — "${snap.label}" (${snap.timestamp})`);
        return;
      }

      if (argv.action === 'list') {
        const snaps = listSnapshots(snapshotPath);
        if (snaps.length === 0) {
          console.log('No snapshots found.');
          return;
        }
        snaps.forEach((s) => {
          console.log(`  ${s.id.slice(0, 8)}  ${s.timestamp}  [${s.checksum}]  ${s.label}`);
        });
        return;
      }

      if (argv.action === 'restore') {
        const id = (argv.id as string | undefined) || (await prompt('Snapshot ID (or prefix): '));
        const snap = getSnapshot(snapshotPath, id);
        if (!snap) { console.error(`Snapshot not found: ${id}`); process.exit(1); }
        const password = await prompt('Vault password: ');
        const { writeEnvFile } = await import('../../env');
        await writeEnvFile(argv.vault as string, snap.data, password);
        console.log(`Restored snapshot "${snap.label}" (${snap.timestamp}) to vault.`);
        return;
      }

      if (argv.action === 'delete') {
        const id = (argv.id as string | undefined) || (await prompt('Snapshot ID (or prefix): '));
        const removed = deleteSnapshot(snapshotPath, id);
        console.log(removed ? `Snapshot ${id} deleted.` : `Snapshot ${id} not found.`);
      }
    }
  );
}
