import * as readline from 'readline';
import type { Argv } from 'yargs';
import {
  createProfile,
  switchProfile,
  deleteProfile,
  listProfiles,
  getActiveProfile,
} from '../../profile/index';

export function prompt(question: string): Promise<string> {
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

/**
 * Prompts the user for a non-empty value, re-prompting if the input is blank.
 */
export async function promptRequired(question: string): Promise<string> {
  let value = '';
  while (!value) {
    value = await prompt(question);
    if (!value) {
      console.error('This field is required. Please enter a value.');
    }
  }
  return value;
}

export function registerProfileCommand(yargs: Argv): Argv {
  return yargs.command(
    'profile <action>',
    'Manage envault profiles',
    (y) =>
      y
        .positional('action', {
          describe: 'Action: create | switch | delete | list | active',
          type: 'string',
          choices: ['create', 'switch', 'delete', 'list', 'active'],
        })
        .option('name', { type: 'string', description: 'Profile name' })
        .option('vault', { type: 'string', description: 'Vault file path' }),
    async (argv) => {
      const action = argv.action as string;
      try {
        if (action === 'create') {
          const name = (argv.name as string) || (await promptRequired('Profile name: '));
          const vaultPath =
            (argv.vault as string) || (await promptRequired('Vault path: '));
          const profile = createProfile(name, vaultPath);
          console.log(`✅ Profile "${profile.name}" created.`);
        } else if (action === 'switch') {
          const name = (argv.name as string) || (await promptRequired('Profile name: '));
          switchProfile(name);
          console.log(`🔄 Switched to profile "${name}".`);
        } else if (action === 'delete') {
          const name = (argv.name as string) || (await promptRequired('Profile name: '));
          deleteProfile(name);
          console.log(`🗑️  Profile "${name}" deleted.`);
        } else if (action === 'list') {
          const profiles = listProfiles();
          const active = getActiveProfile();
          if (profiles.length === 0) {
            console.log('No profiles found.');
          } else {
            profiles.forEach((p) => {
              const marker = p.name === active?.name ? '* ' : '  ';
              console.log(`${marker}${p.name} → ${p.vaultPath}`);
            });
          }
        } else if (action === 'active') {
          const active = getActiveProfile();
          if (!active) {
            console.log('No active profile.');
          } else {
            console.log(`Active profile: ${active.name} (${active.vaultPath})`);
          }
        }
      } catch (err: unknown) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    }
  );
}
