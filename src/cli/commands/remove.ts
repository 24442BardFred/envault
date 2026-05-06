import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { defaultVaultPath } from '../../vault/index';
import { loadVault, saveVault } from '../../vault/vault';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function removeCommand(keyArg?: string): Promise<void> {
  const vaultPath = defaultVaultPath();

  if (!fs.existsSync(vaultPath)) {
    console.error('No vault found. Run `envault init` first.');
    process.exit(1);
  }

  const key = keyArg ?? (await prompt('Key to remove: '));
  if (!key) {
    console.error('Key name is required.');
    process.exit(1);
  }

  const masterPassword = await prompt('Master password: ');
  if (!masterPassword) {
    console.error('Master password is required.');
    process.exit(1);
  }

  try {
    const vault = await loadVault(vaultPath, masterPassword);

    if (!(key in vault)) {
      console.error(`Key "${key}" not found in vault.`);
      process.exit(1);
    }

    delete vault[key];
    await saveVault(vaultPath, masterPassword, vault);
    console.log(`Removed "${key}" from vault.`);
  } catch (err) {
    console.error('Failed to update vault:', (err as Error).message);
    process.exit(1);
  }
}
