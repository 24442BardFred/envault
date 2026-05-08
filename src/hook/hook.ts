import * as fs from 'fs';
import * as path from 'path';

export type HookEvent = 'pre-set' | 'post-set' | 'pre-get' | 'post-get' | 'pre-rotate' | 'post-rotate';

export interface HookDefinition {
  event: HookEvent;
  command: string;
}

export interface HookStore {
  hooks: HookDefinition[];
}

export function getHookPath(vaultDir: string): string {
  return path.join(vaultDir, '.envault-hooks.json');
}

export function loadHookStore(vaultDir: string): HookStore {
  const hookPath = getHookPath(vaultDir);
  if (!fs.existsSync(hookPath)) {
    return { hooks: [] };
  }
  const raw = fs.readFileSync(hookPath, 'utf-8');
  return JSON.parse(raw) as HookStore;
}

export function saveHookStore(vaultDir: string, store: HookStore): void {
  const hookPath = getHookPath(vaultDir);
  fs.writeFileSync(hookPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function registerHook(vaultDir: string, event: HookEvent, command: string): void {
  const store = loadHookStore(vaultDir);
  const exists = store.hooks.some(h => h.event === event && h.command === command);
  if (!exists) {
    store.hooks.push({ event, command });
    saveHookStore(vaultDir, store);
  }
}

export function removeHook(vaultDir: string, event: HookEvent, command: string): boolean {
  const store = loadHookStore(vaultDir);
  const before = store.hooks.length;
  store.hooks = store.hooks.filter(h => !(h.event === event && h.command === command));
  if (store.hooks.length !== before) {
    saveHookStore(vaultDir, store);
    return true;
  }
  return false;
}

export function listHooks(vaultDir: string, event?: HookEvent): HookDefinition[] {
  const store = loadHookStore(vaultDir);
  return event ? store.hooks.filter(h => h.event === event) : store.hooks;
}

export function runHooks(vaultDir: string, event: HookEvent): void {
  const hooks = listHooks(vaultDir, event);
  const { execSync } = require('child_process');
  for (const hook of hooks) {
    try {
      execSync(hook.command, { stdio: 'inherit' });
    } catch (err) {
      console.error(`Hook failed for event "${event}": ${hook.command}`);
    }
  }
}
