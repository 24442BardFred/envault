#!/usr/bin/env node
import { program } from 'commander';
import { initCommand } from './commands/init';
import { setCommand, unsetCommand } from './commands/set';
import { getCommand, listEnvironmentsCommand } from './commands/get';

program
  .name('envault')
  .description('Secure .env file manager with team-sharing support')
  .version('0.1.0');

program
  .command('init')
  .description('Initialise a new envault vault')
  .option('-p, --path <path>', 'Path to vault file')
  .action((opts) => initCommand({ vaultPath: opts.path }));

program
  .command('set <key> <value>')
  .description('Store a key-value pair in the vault')
  .requiredOption('--password <password>', 'Master password')
  .option('-e, --env <environment>', 'Target environment', 'default')
  .option('-p, --path <path>', 'Path to vault file')
  .action((key, value, opts) =>
    setCommand({ key, value, password: opts.password, environment: opts.env, vaultPath: opts.path }));

program
  .command('unset <key>')
  .description('Remove a key from the vault')
  .requiredOption('--password <password>', 'Master password')
  .option('-e, --env <environment>', 'Target environment', 'default')
  .option('-p, --path <path>', 'Path to vault file')
  .action((key, opts) =>
    unsetCommand({ key, password: opts.password, environment: opts.env, vaultPath: opts.path }));

program
  .command('get [key]')
  .description('Get a key or list all keys in an environment')
  .requiredOption('--password <password>', 'Master password')
  .option('-e, --env <environment>', 'Target environment', 'default')
  .option('-p, --path <path>', 'Path to vault file')
  .action((key, opts) =>
    getCommand({ key, password: opts.password, environment: opts.env, vaultPath: opts.path }));

program
  .command('envs')
  .description('List all environments in the vault')
  .requiredOption('--password <password>', 'Master password')
  .option('-p, --path <path>', 'Path to vault file')
  .action((opts) => listEnvironmentsCommand({ password: opts.password, vaultPath: opts.path }));

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
