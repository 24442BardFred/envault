/**
 * Sort environment variable entries by key, with optional grouping by prefix.
 */

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  order?: SortOrder;
  groupByPrefix?: boolean;
  prefixDelimiter?: string;
}

export interface SortReport {
  original: Record<string, string>;
  sorted: Record<string, string>;
  changed: boolean;
  keyOrder: string[];
}

export function sortEnv(
  env: Record<string, string>,
  options: SortOptions = {}
): SortReport {
  const { order = 'asc', groupByPrefix = false, prefixDelimiter = '_' } = options;

  const keys = Object.keys(env);

  let sortedKeys: string[];

  if (groupByPrefix) {
    const groups = new Map<string, string[]>();
    for (const key of keys) {
      const delimIndex = key.indexOf(prefixDelimiter);
      const prefix = delimIndex !== -1 ? key.slice(0, delimIndex) : key;
      if (!groups.has(prefix)) groups.set(prefix, []);
      groups.get(prefix)!.push(key);
    }

    const sortedPrefixes = Array.from(groups.keys()).sort((a, b) =>
      order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );

    sortedKeys = sortedPrefixes.flatMap((prefix) =>
      groups.get(prefix)!.sort((a, b) =>
        order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      )
    );
  } else {
    sortedKeys = [...keys].sort((a, b) =>
      order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
  }

  const sorted: Record<string, string> = {};
  for (const key of sortedKeys) {
    sorted[key] = env[key];
  }

  const changed = keys.some((key, i) => key !== sortedKeys[i]);

  return { original: env, sorted, changed, keyOrder: sortedKeys };
}

export function formatSortReport(report: SortReport): string {
  if (!report.changed) {
    return 'ℹ Keys are already in sorted order. No changes made.';
  }
  const lines = ['✔ Sorted environment keys:', ...report.keyOrder.map((k) => `  ${k}`)];
  return lines.join('\n');
}
