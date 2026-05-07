import { parseEnv } from '../env/parser';

export interface EnvDiff {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { from: string; to: string }>;
  unchanged: Record<string, string>;
}

/**
 * Compares two .env content strings and returns a structured diff.
 */
export function diffEnv(fromContent: string, toContent: string): EnvDiff {
  const fromMap = parseEnv(fromContent);
  const toMap = parseEnv(toContent);

  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, { from: string; to: string }> = {};
  const unchanged: Record<string, string> = {};

  const allKeys = new Set([...Object.keys(fromMap), ...Object.keys(toMap)]);

  for (const key of allKeys) {
    const inFrom = Object.prototype.hasOwnProperty.call(fromMap, key);
    const inTo = Object.prototype.hasOwnProperty.call(toMap, key);

    if (inFrom && inTo) {
      if (fromMap[key] === toMap[key]) {
        unchanged[key] = fromMap[key];
      } else {
        changed[key] = { from: fromMap[key], to: toMap[key] };
      }
    } else if (inFrom && !inTo) {
      removed[key] = fromMap[key];
    } else if (!inFrom && inTo) {
      added[key] = toMap[key];
    }
  }

  return { added, removed, changed, unchanged };
}

/**
 * Formats an EnvDiff into a human-readable string.
 */
export function formatDiff(diff: EnvDiff): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(diff.added)) {
    lines.push(`+ ${key}=${value}`);
  }

  for (const [key, value] of Object.entries(diff.removed)) {
    lines.push(`- ${key}=${value}`);
  }

  for (const [key, { from, to }] of Object.entries(diff.changed)) {
    lines.push(`~ ${key}: ${from} → ${to}`);
  }

  if (lines.length === 0) {
    return '(no differences)';
  }

  return lines.join('\n');
}
