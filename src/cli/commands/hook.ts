import { Argv } from 'yargs';
import * as readline from 'readline';
import { registerHook, removeHook, listHooks, HookEvent } from '../../hook';
import { defaultVaultPath } from '../../vault';
import * as path from 'path';

const VALID_EVENTS: HookEvent[] = [
  'pre-set', 'post-set', 'pre-get', 'post-get', 'pre-rotate', 'post-rotate',
];

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

export function registerHookCommand(yargs: Argv): void {
  yargs.command(
    'hook <action>',
    'Manage lifecycle hooks for vault events',
    (y) =>
      y
        .positional('action', { describe: 'add | remove | list', type: 'string' })
        .option('event', { alias: 'e', type: 'string', describe: `Hook event (${VALID_EVENTS.join(', ')})` })
        .option('command', { alias: 'c', type: 'string', describe: 'Shell command to run' }),
    async (argv) => {
      const vaultDir = path.dirname(defaultVaultPath);
      const action = argv.action as string;

      if (action === 'list') {
        const event = argv.event as HookEvent | undefined;
        const hooks = listHooks(vaultDir, event);
        if (hooks.length === 0) {
          console.log('No hooks registered.');
        } else {
          hooks.forEach(h => console.log(`[${h.event}] ${h.command}`));
        }
        return;
      }

      let event = argv.event as string;
      if (!event) {
        event = await prompt(`Event (${VALID_EVENTS.join(', ')}): `);
      }
      if (!VALID_EVENTS.includes(event as HookEvent)) {
        console.error(`Invalid event: ${event}`);
        process.exit(1);
      }

      let command = argv.command as string;
      if (!command) {
        command = await prompt('Shell command: ');
      }

      if (action === 'add') {
        registerHook(vaultDir, event as HookEvent, command);
        console.log(`Hook registered: [${event}] ${command}`);
      } else if (action === 'remove') {
        const removed = removeHook(vaultDir, event as HookEvent, command);
        console.log(removed ? `Hook removed.` : `Hook not found.`);
      } else {
        console.error(`Unknown action: ${action}. Use add, remove, or list.`);
        process.exit(1);
      }
    }
  );
}
