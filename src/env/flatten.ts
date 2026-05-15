/**
 * Flatten nested environment variable groups into a flat key=value map,
 * and expand a flat map back into grouped form.
 */

export interface FlattenReport {
  original: Record<string, string>;
  flattened: Record<string, string>;
  separator: string;
  count: number;
}

/**
 * Flatten a nested object (up to one level of grouping by prefix) into a flat
 * Record<string, string>. Keys are joined with `separator`.
 */
export function flattenEnv(
  nested: Record<string, Record<string, string> | string>,
  separator = "__"
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [topKey, value] of Object.entries(nested)) {
    if (typeof value === "string") {
      result[topKey] = value;
    } else {
      for (const [subKey, subVal] of Object.entries(value)) {
        result[`${topKey}${separator}${subKey}`] = subVal;
      }
    }
  }
  return result;
}

/**
 * Expand a flat Record<string, string> into a nested structure by splitting
 * keys on `separator`. Keys without the separator remain at the top level.
 */
export function expandEnv(
  flat: Record<string, string>,
  separator = "__"
): Record<string, Record<string, string> | string> {
  const result: Record<string, Record<string, string> | string> = {};
  for (const [key, value] of Object.entries(flat)) {
    const idx = key.indexOf(separator);
    if (idx === -1) {
      result[key] = value;
    } else {
      const prefix = key.slice(0, idx);
      const rest = key.slice(idx + separator.length);
      if (!result[prefix] || typeof result[prefix] === "string") {
        result[prefix] = {};
      }
      (result[prefix] as Record<string, string>)[rest] = value;
    }
  }
  return result;
}

export function formatFlattenReport(report: FlattenReport): string {
  const lines: string[] = [
    `Flattened ${report.count} key(s) using separator "${report.separator}"`,
    "",
    "Result:",
    ...Object.entries(report.flattened).map(([k, v]) => `  ${k}=${v}`),
  ];
  return lines.join("\n");
}
