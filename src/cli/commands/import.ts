import { Command } from 'commander';
import * as readline from 'readline';
import { loadVault, saveVault } from '../../vault/index';
import { importShareBundle } from '../../share/index';
import * as fs from 'fs';
import * as path from 'path';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

export function registerImportCommand(program: Command): void {
  program
    .command('import <bundleFile>')
    .description('Import an encrypted share bundle into the local vault')
    .option('--overwrite', 'Overwrite existing keys', false)
    .action(async (bundleFile: string, options) => {
      try {
        const bundlePath = path.resolve(bundleFile);
        if (!fs.existsSync(bundlePath)) {
          console.error(`Bundle file not found: ${bundlePath}`);
          process.exit(1);
        }

        const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
        const sharePassword = await prompt('Enter share bundle password: ');
        const masterPassword = await prompt('Enter master password: ');

        const vault = await loadVault(masterPassword);
        const imported = await importShareBundle(bundleContent, sharePassword, vault, options.overwrite);

        await saveVault(imported, masterPassword);
        console.log('Share bundle imported successfully.');
      } catch (err: any) {
        console.error('Error importing share bundle:', err.message);
        process.exit(1);
      }
    });
}
