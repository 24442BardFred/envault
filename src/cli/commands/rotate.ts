import type { Argv } from 'yargs';
import * as readline from 'readline';
import { rotateKey, validatePassword } from '../../rotation/index';
import { defaultVaultPath } from '../../vault/index';

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden && (rl as any).stdoutMuted !== undefined) {
      (rl as any).stdoutMuted = true;
    }
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function registerRotateCommand(yargs: Argv): Argv {
  return yargs.command(
    'rotate',
    'Rotate the master encryption key for the vault',
    (y) =>
      y.option('vault', {
        alias: 'v',
        type: 'string',
        description: 'Path to the vault file',
        default: defaultVaultPath,
      }),
    async (argv) => {
      const vaultPath = argv.vault as string;

      const oldPassword = await prompt('Current master password: ', true);

      const valid = await validatePassword(vaultPath, oldPassword);
      if (!valid) {
        console.error('Error: Current password is incorrect.');
        process.exit(1);
      }

      const newPassword = await prompt('New master password: ', true);
      const confirmPassword = await prompt('Confirm new master password: ', true);

      if (newPassword !== confirmPassword) {
        console.error('Error: New passwords do not match.');
        process.exit(1);
      }

      if (newPassword.length < 8) {
        console.error('Error: New password must be at least 8 characters.');
        process.exit(1);
      }

      try {
        const result = await rotateKey(vaultPath, oldPassword, newPassword);
        console.log(`✔ Key rotated successfully at ${result.rotatedAt}`);
        console.log(`  ${result.entriesRotated} entries re-encrypted.`);
      } catch (err: any) {
        console.error(`Error rotating key: ${err.message}`);
        process.exit(1);
      }
    }
  );
}
