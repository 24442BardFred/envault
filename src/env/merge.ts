/**
 * Merges multiple env records together with configurable conflict resolution.
 * Later sources take precedence unless `preferExisting` is set.
 */

export type MergeStrategy = 'overwrite' | 'preserve' | 'error';

export interface MergeOptions {
  strategy?: MergeStrategy;
  ignoreEmpty?: boolean;
}

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: Array<{ key: string; existing: string; incoming: string }>;
  skipped: string[];
}

export function mergeEnv(
  base: Record<string, string>,
  ...sources: Array<{ data: Record<string, string>; options?: MergeOptions }>
): MergeResult {
  const merged: Record<string, string> = { ...base };
  const conflicts: MergeResult['conflicts'] = [];
  const skipped: string[] = [];

  for (const source of sources) {
    const { data, options = {} } = source;
    const { strategy = 'overwrite', ignoreEmpty = false } = options;

    for (const [key, value] of Object.entries(data)) {
      if (ignoreEmpty && value.trim() === '') {
        skipped.push(key);
        continue;
      }

      if (key in merged && merged[key] !== value) {
        conflicts.push({ key, existing: merged[key], incoming: value });

        if (strategy === 'error') {
          throw new Error(
            `Merge conflict on key "${key}": existing="${merged[key]}", incoming="${value}"`
          );
        }

        if (strategy === 'preserve') {
          skipped.push(key);
          continue;
        }
      }

      merged[key] = value;
    }
  }

  return { merged, conflicts, skipped };
}

export function formatMergeReport(result: MergeResult): string {
  const lines: string[] = [];

  if (result.conflicts.length === 0 && result.skipped.length === 0) {
    lines.push('Merge completed with no conflicts.');
    return lines.join('\n');
  }

  if (result.conflicts.length > 0) {
    lines.push(`Conflicts (${result.conflicts.length}):`);
    for (const c of result.conflicts) {
      lines.push(`  ${c.key}: "${c.existing}" -> "${c.incoming}"`);
    }
  }

  if (result.skipped.length > 0) {
    lines.push(`Skipped keys: ${result.skipped.join(', ')}`);
  }

  return lines.join('\n');
}
