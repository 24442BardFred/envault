/**
 * Trim whitespace and optional quote characters from env values.
 */

export interface TrimOptions {
  /** Strip surrounding single/double quotes in addition to whitespace */
  stripQuotes?: boolean;
  /** Only trim these specific keys (trims all if omitted) */
  keys?: string[];
}

export interface TrimReport {
  trimmed: Record<string, { before: string; after: string }>;
  unchanged: string[];
}

const QUOTE_RE = /^(['"])(.*)\1$/s;

export function trimValue(value: string, stripQuotes: boolean): string {
  let v = value.trim();
  if (stripQuotes) {
    const m = QUOTE_RE.exec(v);
    if (m) v = m[2].trim();
  }
  return v;
}

export function trimEnv(
  env: Record<string, string>,
  options: TrimOptions = {}
): { result: Record<string, string>; report: TrimReport } {
  const { stripQuotes = false, keys } = options;
  const targetKeys = keys && keys.length > 0 ? new Set(keys) : null;

  const result: Record<string, string> = {};
  const report: TrimReport = { trimmed: {}, unchanged: [] };

  for (const [key, value] of Object.entries(env)) {
    if (targetKeys && !targetKeys.has(key)) {
      result[key] = value;
      report.unchanged.push(key);
      continue;
    }

    const after = trimValue(value, stripQuotes);
    if (after !== value) {
      result[key] = after;
      report.trimmed[key] = { before: value, after };
    } else {
      result[key] = value;
      report.unchanged.push(key);
    }
  }

  return { result, report };
}

export function formatTrimReport(report: TrimReport): string {
  const lines: string[] = [];
  const trimmedKeys = Object.keys(report.trimmed);

  if (trimmedKeys.length === 0) {
    lines.push('No values required trimming.');
  } else {
    lines.push(`Trimmed ${trimmedKeys.length} value(s):`);
    for (const key of trimmedKeys) {
      const { before, after } = report.trimmed[key];
      lines.push(`  ${key}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
    }
  }

  if (report.unchanged.length > 0) {
    lines.push(`Unchanged: ${report.unchanged.join(', ')}`);
  }

  return lines.join('\n');
}
