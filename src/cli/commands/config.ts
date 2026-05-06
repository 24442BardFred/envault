import { Argv } from 'yargs';
import { loadConfig, saveConfig, resetConfig, DEFAULT_CONFIG } from '../../config';
import type { EnvaultConfig } from '../../config';

const VALID_KEYS = Object.keys(DEFAULT_CONFIG) as (keyof EnvaultConfig)[];

export function registerConfigCommand(yargs: Argv): Argv {
  return yargs.command(
    'config <action> [key] [value]',
    'Manage envault configuration',
    (y) =>
      y
        .positional('action', {
          describe: 'Action: get | set | list | reset',
          type: 'string',
          choices: ['get', 'set', 'list', 'reset'],
        })
        .positional('key', {
          describe: 'Config key',
          type: 'string',
        })
        .positional('value', {
          describe: 'Config value (for set action)',
          type: 'string',
        }),
    (argv) => {
      const { action, key, value } = argv as {
        action: string;
        key?: string;
        value?: string;
      };

      if (action === 'list') {
        const config = loadConfig();
        console.log('Current configuration:');
        for (const [k, v] of Object.entries(config)) {
          console.log(`  ${k} = ${v}`);
        }
        return;
      }

      if (action === 'reset') {
        resetConfig();
        console.log('Configuration reset to defaults.');
        return;
      }

      if (!key) {
        console.error('Error: key is required for get/set actions.');
        process.exit(1);
      }

      if (!VALID_KEYS.includes(key as keyof EnvaultConfig)) {
        console.error(`Error: unknown config key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
        process.exit(1);
      }

      const typedKey = key as keyof EnvaultConfig;

      if (action === 'get') {
        const config = loadConfig();
        console.log(`${typedKey} = ${config[typedKey]}`);
        return;
      }

      if (action === 'set') {
        if (value === undefined) {
          console.error('Error: value is required for set action.');
          process.exit(1);
        }
        const parsed: unknown =
          value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) ? value : Number(value);
        saveConfig({ [typedKey]: parsed } as Partial<EnvaultConfig>);
        console.log(`Set ${typedKey} = ${parsed}`);
      }
    }
  );
}
