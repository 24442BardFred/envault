import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import { defaultVaultPath } from '../../vault/index';
import { createVault } from '../../vault/vault';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function initCommand(options: { vaultPath?: string } = {}): Promise<void> {
  const vaultPath = options.vaultPath ?? defaultVaultPath;

  if (fs.existsSync(vaultPath)) {
    console.log(`Vault already exists at: ${vaultPath}`);
    return;
  }

  console.log('Initialising envault vault...');

  const password = await prompt('Enter a master password: ');
  if (!password || password.trim().length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const confirm = await prompt('Confirm master password: ');
  if (password !== confirm) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  await createVault(vaultPath, password);
  console.log(`Vault initialised at: ${path.resolve(vaultPath)}`);
  console.log('Keep your master password safe — it cannot be recovered.');
}
