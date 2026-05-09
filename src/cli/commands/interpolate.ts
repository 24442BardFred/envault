import { Command } from 'commander';
import * as readline from 'readline';
import { readEnvFile } from '../../env/index';
import { interpolateEnv } from '../../env/interpolate';
import { serialiseEnv } from '../../env/parser';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerInterpolateCommand(program: Command): void {
  program
    .command('interpolate <envFile>')
    .description('Resolve variable references (${VAR}) within a .env file')
    .option('-o, --output <file>', 'Write resolved values to a file instead of stdout')
    .option('--check', 'Exit with error code if any references are unresolved or circular')
    .action(async (envFile: string, options: { output?: string; check?: boolean }) => {
      try {
        const env = await readEnvFile(envFile);
        const { resolved, unresolved, circular } = interpolateEnv(env);

        if (circular.length > 0) {
          console.warn(`⚠  Circular references detected: ${circular.join(', ')}`);
        }
        if (unresolved.length > 0) {
          console.warn(`⚠  Unresolved references in keys: ${unresolved.join(', ')}`);
        }

        if (options.check && (circular.length > 0 || unresolved.length > 0)) {
          process.exit(1);
        }

        const output = serialiseEnv(resolved);

        if (options.output) {
          const fs = await import('fs');
          await fs.promises.writeFile(options.output, output, 'utf-8');
          console.log(`✔  Resolved env written to ${options.output}`);
        } else {
          process.stdout.write(output);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`✖  interpolate failed: ${message}`);
        process.exit(1);
      }
    });
}
