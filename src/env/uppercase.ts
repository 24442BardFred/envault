/**
 * uppercase.ts
 * Normalise .env key casing — convert all keys to UPPER_SNAKE_CASE.
 */

export interface UppercaseReport {
  changed: { from: string; to: string }[];
  skipped: string[];
  result: Record<string, string>;
}

/**
 * Convert a key to UPPER_SNAKE_CASE.
 * Handles camelCase, PascalCase, kebab-case, and dot.notation.
 */
export function toUpperSnakeCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1_$2')   // camelCase → camel_Case
    .replace(/[\-.\s]+/g, '_')              // separators → _
    .toUpperCase();
}

/**
 * Uppercase all keys in an env map.
 * If two keys would collide after normalisation the original value is kept
 * and the conflicting key is added to `skipped`.
 */
export function uppercaseEnv(
  env: Record<string, string>
): UppercaseReport {
  const result: Record<string, string> = {};
  const changed: { from: string; to: string }[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    const newKey = toUpperSnakeCase(key);

    if (newKey in result) {
      skipped.push(key);
      continue;
    }

    result[newKey] = value;

    if (newKey !== key) {
      changed.push({ from: key, to: newKey });
    }
  }

  return { changed, skipped, result };
}

export function formatUppercaseReport(report: UppercaseReport): string {
  const lines: string[] = [];

  if (report.changed.length === 0 && report.skipped.length === 0) {
    lines.push('All keys are already uppercase.');
    return lines.join('\n');
  }

  if (report.changed.length > 0) {
    lines.push(`Renamed ${report.changed.length} key(s):`);
    for (const { from, to } of report.changed) {
      lines.push(`  ${from} → ${to}`);
    }
  }

  if (report.skipped.length > 0) {
    lines.push(`Skipped ${report.skipped.length} key(s) due to collision:`);
    for (const key of report.skipped) {
      lines.push(`  ${key}`);
    }
  }

  return lines.join('\n');
}
