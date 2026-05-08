import * as fs from 'fs';
import * as path from 'path';
import { readEnvFile, writeEnvFile } from '../env/index';
import { logAction } from '../audit/index';

export type WatchCallback = (changedKeys: string[], filePath: string) => void;

export interface WatchHandle {
  stop: () => void;
}

export function watchEnvFile(
  filePath: string,
  vaultPassword: string,
  vaultPath: string,
  onChange: WatchCallback
): WatchHandle {
  const absPath = path.resolve(filePath);
  let previousEnv: Record<string, string> = {};

  try {
    previousEnv = readEnvFile(absPath);
  } catch {
    previousEnv = {};
  }

  const watcher = fs.watch(absPath, { persistent: false }, async (eventType) => {
    if (eventType !== 'change') return;

    let currentEnv: Record<string, string>;
    try {
      currentEnv = readEnvFile(absPath);
    } catch {
      return;
    }

    const changedKeys = detectChangedKeys(previousEnv, currentEnv);

    if (changedKeys.length > 0) {
      try {
        await writeEnvFile(vaultPath, vaultPassword, currentEnv);
        await logAction('watch-sync', `Auto-synced keys: ${changedKeys.join(', ')} from ${absPath}`);
        onChange(changedKeys, absPath);
      } catch (err) {
        // silently skip on sync error
      }
      previousEnv = { ...currentEnv };
    }
  });

  return {
    stop: () => watcher.close(),
  };
}

export function detectChangedKeys(
  previous: Record<string, string>,
  current: Record<string, string>
): string[] {
  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);
  const changed: string[] = [];

  for (const key of allKeys) {
    if (previous[key] !== current[key]) {
      changed.push(key);
    }
  }

  return changed;
}
