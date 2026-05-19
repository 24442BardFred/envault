import { Command } from 'commander';
import * as readline from 'readline';
import { maskEnv, formatMaskReport, MaskOptions } from '../../env/mask';
import { parseEnv } from '../../env/parser';
import * as fs from 'fs';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerMaskCommand(program: Command): void {
  program
    .command('mask')
    .description('Display env values with sensitive data masked')
    .option('-f, --file <path>', 'Path to .env file', '.env')
    .option('-k, --keys <keys>', 'Comma-separated keys to mask (default: all)')
    .option('-r, --reveal <n>', 'Number of trailing characters to reveal', '4')
    .option('-m, --mask-char <char>', 'Character used for masking', '*')
    .option('--min-length <n>', 'Minimum value length for partial reveal', '8')
    .action(async (opts) => {
      const filePath: string = opts.file;

      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const env = parseEnv(raw);

      const keys: string[] | undefined = opts.keys
        ? opts.keys.split(',').map((k: string) => k.trim()).filter(Boolean)
        : undefined;

      const options: MaskOptions = {
        revealChars: parseInt(opts.reveal, 10),
        maskChar: opts.maskChar,
        minLength: parseInt(opts.minLength, 10),
      };

      const report = maskEnv(env, keys, options);
      console.log(formatMaskReport(report));
    });
}
