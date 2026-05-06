import * as fs from 'fs';
import * as readline from 'readline';
import { defaultVaultPath } from '../../vault/index';
import { loadVault } from '../../vault/vault';

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

export async function listCommand(showValues: boolean = false): Promise<void> {
  const vaultPath = defaultVaultPath();

  if (!fs.existsSync(vaultPath)) {
    console.error('No vault found. Run `envault init` first.');
    process.exit(1);
  }

  const masterPassword = await prompt('Master password: ');
  if (!masterPassword) {
    console.error('Master password is required.');
    process.exit(1);
  }

  try {
    const vault = await loadVault(vaultPath, masterPassword);
    const keys = Object.keys(vault);

    if (keys.length === 0) {
      console.log('Vault is empty.');
      return;
    }

    console.log(`\nVault contains ${keys.length} key(s):\n`);
    for (const key of keys.sort()) {
      if (showValues) {
        console.log(`  ${key}=${vault[key]}`);
      } else {
        console.log(`  ${key}`);
      }
    }
    console.log();
  } catch (err) {
    console.error('Failed to read vault:', (err as Error).message);
    process.exit(1);
  }
}
