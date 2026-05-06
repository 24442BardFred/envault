import { Command } from 'commander';
import * as readline from 'readline';
import { loadVault } from '../../vault/index';
import { createShareBundle } from '../../share/index';
import * as fs from 'fs';
import * as path from 'path';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

export function registerShareCommand(program: Command): void {
  program
    .command('share')
    .description('Export an encrypted share bundle for team sharing')
    .option('-o, --output <file>', 'Output file path', 'envault-share.bundle')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to share (default: all)')
    .action(async (options) => {
      try {
        const masterPassword = await prompt('Enter master password: ');
        const vault = await loadVault(masterPassword);

        const keysToShare: string[] | undefined = options.keys
          ? options.keys.split(',').map((k: string) => k.trim())
          : undefined;

        const sharePassword = await prompt('Enter share bundle password: ');
        const confirmPassword = await prompt('Confirm share bundle password: ');

        if (sharePassword !== confirmPassword) {
          console.error('Passwords do not match.');
          process.exit(1);
        }

        const bundle = await createShareBundle(vault, sharePassword, keysToShare);
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, bundle, 'utf-8');

        console.log(`Share bundle written to: ${outputPath}`);
      } catch (err: any) {
        console.error('Error creating share bundle:', err.message);
        process.exit(1);
      }
    });
}
