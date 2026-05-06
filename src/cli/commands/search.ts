import type { Argv } from 'yargs';
import * as readline from 'readline';
import { searchVault } from '../../search/index';
import { resolveVaultPath } from '../../profile/index';
import { defaultVaultPath } from '../../vault/index';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerSearchCommand(yargs: Argv): Argv {
  return yargs.command(
    'search <query>',
    'Search for keys (and optionally values) in the vault',
    (y) =>
      y
        .positional('query', { type: 'string', describe: 'Search term', demandOption: true })
        .option('values', { alias: 'v', type: 'boolean', default: false, describe: 'Also search in values' })
        .option('exact', { alias: 'e', type: 'boolean', default: false, describe: 'Exact match only' })
        .option('case-sensitive', { alias: 'c', type: 'boolean', default: false, describe: 'Case-sensitive search' }),
    async (argv) => {
      try {
        const password = await prompt('Vault password: ');
        const vaultPath = resolveVaultPath(defaultVaultPath);
        const results = await searchVault(
          argv.query as string,
          password,
          {
            searchValues: argv.values as boolean,
            exactMatch: argv.exact as boolean,
            caseSensitive: argv['case-sensitive'] as boolean,
          },
          vaultPath
        );

        if (results.length === 0) {
          console.log('No matches found.');
          return;
        }

        console.log(`Found ${results.length} match(es):\n`);
        for (const r of results) {
          const tag = r.matchedOn !== 'key' ? ` (matched on ${r.matchedOn})` : '';
          console.log(`  ${r.key}=${r.value}${tag}`);
        }
      } catch (err: unknown) {
        console.error('Search failed:', (err as Error).message);
        process.exit(1);
      }
    }
  );
}
