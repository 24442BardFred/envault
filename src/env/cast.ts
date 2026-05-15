/**
 * cast.ts — Type-casting utilities for env values.
 * Converts raw string env values to typed primitives.
 */

export type CastType = 'string' | 'number' | 'boolean' | 'json';

export interface CastRule {
  key: string;
  type: CastType;
}

export interface CastResult {
  key: string;
  original: string;
  casted: unknown;
  type: CastType;
  error?: string;
}

export interface CastReport {
  results: CastResult[];
  errors: CastResult[];
}

export function castValue(value: string, type: CastType): { casted: unknown; error?: string } {
  try {
    switch (type) {
      case 'number': {
        const n = Number(value);
        if (isNaN(n)) throw new Error(`Cannot cast "${value}" to number`);
        return { casted: n };
      }
      case 'boolean': {
        const lower = value.toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(lower)) return { casted: true };
        if (['false', '0', 'no', 'off'].includes(lower)) return { casted: false };
        throw new Error(`Cannot cast "${value}" to boolean`);
      }
      case 'json': {
        return { casted: JSON.parse(value) };
      }
      default:
        return { casted: value };
    }
  } catch (err) {
    return { casted: value, error: (err as Error).message };
  }
}

export function castEnv(
  env: Record<string, string>,
  rules: CastRule[]
): { casted: Record<string, unknown>; report: CastReport } {
  const casted: Record<string, unknown> = { ...env };
  const results: CastResult[] = [];
  const errors: CastResult[] = [];

  for (const rule of rules) {
    if (!(rule.key in env)) continue;
    const original = env[rule.key];
    const { casted: castedVal, error } = castValue(original, rule.type);
    const result: CastResult = { key: rule.key, original, casted: castedVal, type: rule.type, error };
    results.push(result);
    if (error) {
      errors.push(result);
    } else {
      casted[rule.key] = castedVal;
    }
  }

  return { casted, report: { results, errors } };
}

export function formatCastReport(report: CastReport): string {
  const lines: string[] = [];
  for (const r of report.results) {
    if (r.error) {
      lines.push(`  ✗ ${r.key}: ${r.error}`);
    } else {
      lines.push(`  ✓ ${r.key}: "${r.original}" → ${r.type}(${JSON.stringify(r.casted)})`);
    }
  }
  return lines.join('\n');
}
