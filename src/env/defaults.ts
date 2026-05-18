/**
 * Apply default values to an env record.
 * Defaults are only applied for keys that are missing or empty.
 */
export interface DefaultsReport {
  applied: Record<string, string>;
  skipped: string[];
}

/**
 * Merge defaults into an env record.
 * Existing non-empty values are preserved; missing or empty keys receive the default.
 */
export function applyDefaults(
  env: Record<string, string>,
  defaults: Record<string, string>,
  overwriteEmpty = true
): { result: Record<string, string>; report: DefaultsReport } {
  const result: Record<string, string> = { ...env };
  const applied: Record<string, string> = {};
  const skipped: string[] = [];

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const existing = env[key];
    const isMissing = existing === undefined;
    const isEmpty = existing === '';

    if (isMissing || (overwriteEmpty && isEmpty)) {
      result[key] = defaultValue;
      applied[key] = defaultValue;
    } else {
      skipped.push(key);
    }
  }

  return { result, report: { applied, skipped } };
}

/**
 * Format a DefaultsReport into a human-readable string.
 */
export function formatDefaultsReport(report: DefaultsReport): string {
  const lines: string[] = [];

  const appliedKeys = Object.keys(report.applied);
  if (appliedKeys.length > 0) {
    lines.push('Applied defaults:');
    for (const key of appliedKeys) {
      lines.push(`  + ${key}=${report.applied[key]}`);
    }
  } else {
    lines.push('No defaults applied.');
  }

  if (report.skipped.length > 0) {
    lines.push('Skipped (already set):');
    for (const key of report.skipped) {
      lines.push(`  - ${key}`);
    }
  }

  return lines.join('\n');
}
