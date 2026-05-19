/**
 * Transform env values using built-in or custom transformers.
 */

export type TransformFn = (value: string) => string;

export type TransformMap = Record<string, TransformFn>;

export interface TransformResult {
  transformed: Record<string, string>;
  skipped: string[];
  errors: Array<{ key: string; message: string }>;
}

const builtinTransformers: Record<string, TransformFn> = {
  uppercase: (v) => v.toUpperCase(),
  lowercase: (v) => v.toLowerCase(),
  trim: (v) => v.trim(),
  base64encode: (v) => Buffer.from(v).toString('base64'),
  base64decode: (v) => Buffer.from(v, 'base64').toString('utf8'),
  urlencode: (v) => encodeURIComponent(v),
  urldecode: (v) => decodeURIComponent(v),
};

export function getBuiltinTransformers(): string[] {
  return Object.keys(builtinTransformers);
}

export function transformEnv(
  env: Record<string, string>,
  transformerName: string,
  keys?: string[],
  custom?: TransformFn
): TransformResult {
  const fn = custom ?? builtinTransformers[transformerName];

  if (!fn) {
    throw new Error(`Unknown transformer: "${transformerName}". Available: ${getBuiltinTransformers().join(', ')}`);
  }

  const targetKeys = keys && keys.length > 0 ? keys : Object.keys(env);
  const transformed: Record<string, string> = { ...env };
  const skipped: string[] = [];
  const errors: Array<{ key: string; message: string }> = [];

  for (const key of targetKeys) {
    if (!(key in env)) {
      skipped.push(key);
      continue;
    }
    try {
      transformed[key] = fn(env[key]);
    } catch (err) {
      errors.push({ key, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { transformed, skipped, errors };
}

export function formatTransformReport(result: TransformResult): string {
  const lines: string[] = [];
  // Count only keys that were actually present and processed without error
  const changedCount = Object.keys(result.transformed).length
    - (Object.keys(result.transformed).length - result.skipped.length - result.errors.length === 0
        ? 0
        : 0);
  const successCount = Object.keys(result.transformed).length - result.skipped.length - result.errors.length;
  lines.push(`Transformed: ${successCount} key(s)`);
  if (result.skipped.length > 0) {
    lines.push(`Skipped (not found): ${result.skipped.join(', ')}`);
  }
  if (result.errors.length > 0) {
    lines.push('Errors:');
    for (const e of result.errors) {
      lines.push(`  ${e.key}: ${e.message}`);
    }
  }
  return lines.join('\n');
}

/**
 * Returns only the keys whose values were changed by the transformation.
 */
export function getChangedKeys(
  original: Record<string, string>,
  result: TransformResult
): string[] {
  return Object.keys(result.transformed).filter(
    (key) => result.transformed[key] !== original[key]
  );
}
