/**
 * Filter env entries by key pattern, value pattern, or tag.
 */

export interface FilterOptions {
  keyPattern?: string;
  valuePattern?: string;
  prefix?: string;
  invert?: boolean;
}

export interface FilterReport {
  total: number;
  matched: number;
  entries: Record<string, string>;
}

export function filterEnv(
  env: Record<string, string>,
  options: FilterOptions
): FilterReport {
  const { keyPattern, valuePattern, prefix, invert = false } = options;

  const keyRegex = keyPattern ? new RegExp(keyPattern, 'i') : null;
  const valueRegex = valuePattern ? new RegExp(valuePattern, 'i') : null;

  const matched: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    let include = true;

    if (prefix && !key.startsWith(prefix)) {
      include = false;
    }

    if (include && keyRegex && !keyRegex.test(key)) {
      include = false;
    }

    if (include && valueRegex && !valueRegex.test(value)) {
      include = false;
    }

    if (invert) include = !include;

    if (include) {
      matched[key] = value;
    }
  }

  return {
    total: Object.keys(env).length,
    matched: Object.keys(matched).length,
    entries: matched,
  };
}

export function formatFilterReport(report: FilterReport): string {
  const lines: string[] = [
    `Matched ${report.matched} of ${report.total} entries:`,
  ];

  if (report.matched === 0) {
    lines.push('  (no matches)');
  } else {
    for (const [key, value] of Object.entries(report.entries)) {
      lines.push(`  ${key}=${value}`);
    }
  }

  return lines.join('\n');
}
