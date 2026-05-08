import type { Argv } from 'yargs';
import * as path from 'path';
import { readEnvFile } from '../../env/index';
import { lintEnv, formatLintResults } from '../../lint/index';
import { resolveVaultPath } from '../../profile/index';

export function registerLintCommand(yargs: Argv): Argv {
  return yargs.command(
    'lint [file]',
    'Lint a .env file for common issues',
    (y) =>
      y
        .positional('file', {
          type: 'string',
          describe: 'Path to .env file to lint (defaults to .env in current directory)',
        })
        .option('strict', {
          type: 'boolean',
          default: false,
          describe: 'Exit with non-zero code if any warnings are found',
        })
        .option('profile', {
          type: 'string',
          describe: 'Profile to use when resolving default vault path',
        }),
    async (argv) => {
      const filePath = argv.file
        ? path.resolve(argv.file as string)
        : path.join(process.cwd(), '.env');

      let env: Record<string, string>;
      try {
        env = await readEnvFile(filePath);
      } catch {
        console.error(`Could not read file: ${filePath}`);
        process.exit(1);
      }

      const issues = lintEnv(env);
      const output = formatLintResults(issues);
      console.log(output);

      const hasErrors = issues.some((i) => i.severity === 'error');
      const hasWarnings = issues.some((i) => i.severity === 'warn');

      if (hasErrors) {
        console.error(`\n${issues.filter((i) => i.severity === 'error').length} error(s) found.`);
        process.exit(1);
      }

      if (argv.strict && hasWarnings) {
        console.warn(`\nStrict mode: ${issues.filter((i) => i.severity === 'warn').length} warning(s) treated as errors.`);
        process.exit(1);
      }
    }
  );
}
