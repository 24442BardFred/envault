/**
 * prefix.ts — Add, remove, or replace a prefix on env variable keys.
 */

export interface PrefixOptions {
  add?: string;
  remove?: string;
  replace?: { from: string; to: string };
}

export interface PrefixReport {
  added: string[];
  removed: string[];
  replaced: string[];
  unchanged: string[];
}

export function prefixEnv(
  env: Record<string, string>,
  options: PrefixOptions
): { result: Record<string, string>; report: PrefixReport } {
  const result: Record<string, string> = {};
  const report: PrefixReport = { added: [], removed: [], replaced: [], unchanged: [] };

  for (const [key, value] of Object.entries(env)) {
    if (options.add) {
      const newKey = `${options.add}${key}`;
      result[newKey] = value;
      report.added.push(`${key} → ${newKey}`);
    } else if (options.remove) {
      if (key.startsWith(options.remove)) {
        const newKey = key.slice(options.remove.length);
        if (newKey.length === 0) {
          report.unchanged.push(key);
          result[key] = value;
        } else {
          result[newKey] = value;
          report.removed.push(`${key} → ${newKey}`);
        }
      } else {
        result[key] = value;
        report.unchanged.push(key);
      }
    } else if (options.replace) {
      const { from, to } = options.replace;
      if (key.startsWith(from)) {
        const newKey = `${to}${key.slice(from.length)}`;
        result[newKey] = value;
        report.replaced.push(`${key} → ${newKey}`);
      } else {
        result[key] = value;
        report.unchanged.push(key);
      }
    } else {
      result[key] = value;
      report.unchanged.push(key);
    }
  }

  return { result, report };
}

export function formatPrefixReport(report: PrefixReport): string {
  const lines: string[] = [];
  if (report.added.length) {
    lines.push('Added prefix:');
    report.added.forEach(l => lines.push(`  + ${l}`));
  }
  if (report.removed.length) {
    lines.push('Removed prefix:');
    report.removed.forEach(l => lines.push(`  - ${l}`));
  }
  if (report.replaced.length) {
    lines.push('Replaced prefix:');
    report.replaced.forEach(l => lines.push(`  ~ ${l}`));
  }
  if (report.unchanged.length) {
    lines.push(`Unchanged: ${report.unchanged.length} key(s)`);
  }
  return lines.join('\n');
}
