import type { Argv } from 'yargs';
import * as readline from 'readline';
import { watchEnvFile } from '../../watch/watch';
import { resolveVaultPath } from '../../profile/index';

const prompt = (rl: readline.Interface, question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

export function registerWatchCommand(yargs: Argv): Argv {
  return yargs.command(
    'watch <file>',
    'Watch a .env file and auto-sync changes to the vault',
    (y) =>
      y.positional('file', {
        describe: 'Path to the .env file to watch',
        type: 'string',
        demandOption: true,
      }),
    async (argv) => {
      const filePath = argv.file as string;
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

      const password = await prompt(rl, 'Vault password: ');
      rl.close();

      if (!password) {
        console.error('Password is required.');
        process.exit(1);
      }

      const vaultPath = resolveVaultPath();

      console.log(`👁  Watching ${filePath} — press Ctrl+C to stop.`);

      const handle = watchEnvFile(filePath, password, vaultPath, (changedKeys, fp) => {
        console.log(`🔄 Synced [${changedKeys.join(', ')}] from ${fp}`);
      });

      process.on('SIGINT', () => {
        handle.stop();
        console.log('\n🛑 Watch stopped.');
        process.exit(0);
      });
    }
  );
}
