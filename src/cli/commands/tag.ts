import * as readline from 'readline';
import type { Argv } from 'yargs';
import { addTag, removeTag, getKeysForTag, listTags, getTagsForKey } from '../../tag';
import { defaultVaultPath } from '../../vault';
import * as path from 'path';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerTagCommand(yargs: Argv): Argv {
  return yargs.command(
    'tag <action>',
    'Manage key tags',
    (y) =>
      y
        .positional('action', {
          choices: ['add', 'remove', 'list', 'keys', 'tags'] as const,
          describe: 'Tag action to perform',
        })
        .option('tag', { alias: 't', type: 'string', describe: 'Tag name' })
        .option('keys', { alias: 'k', type: 'array', describe: 'Env keys to associate' })
        .option('key', { type: 'string', describe: 'Single env key to look up tags for' }),
    async (argv) => {
      const vaultDir = path.dirname(defaultVaultPath);
      const action = argv.action as string;

      if (action === 'add') {
        const tag = (argv.tag as string) || (await prompt('Tag name: '));
        const rawKeys = (argv.keys as string[]) || [];
        const keys = rawKeys.length > 0 ? rawKeys : (await prompt('Keys (comma-separated): ')).split(',').map((k) => k.trim()).filter(Boolean);
        addTag(vaultDir, tag, keys);
        console.log(`Tag "${tag}" updated with keys: ${keys.join(', ')}`);
      } else if (action === 'remove') {
        const tag = (argv.tag as string) || (await prompt('Tag name to remove: '));
        removeTag(vaultDir, tag);
        console.log(`Tag "${tag}" removed.`);
      } else if (action === 'list') {
        const tags = listTags(vaultDir);
        if (tags.length === 0) {
          console.log('No tags defined.');
        } else {
          console.log('Tags:\n' + tags.map((t) => `  ${t}`).join('\n'));
        }
      } else if (action === 'keys') {
        const tag = (argv.tag as string) || (await prompt('Tag name: '));
        const keys = getKeysForTag(vaultDir, tag);
        if (keys.length === 0) {
          console.log(`No keys for tag "${tag}".`);
        } else {
          console.log(`Keys for "${tag}":\n` + keys.map((k) => `  ${k}`).join('\n'));
        }
      } else if (action === 'tags') {
        const key = (argv.key as string) || (await prompt('Env key: '));
        const tags = getTagsForKey(vaultDir, key);
        if (tags.length === 0) {
          console.log(`No tags for key "${key}".`);
        } else {
          console.log(`Tags for "${key}":\n` + tags.map((t) => `  ${t}`).join('\n'));
        }
      }
    }
  );
}
