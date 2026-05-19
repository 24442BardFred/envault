/**
 * mask.ts — Mask env values with partial reveal support
 */

export interface MaskOptions {
  revealChars?: number; // number of trailing chars to reveal (default: 4)
  maskChar?: string;   // character used for masking (default: '*')
  minLength?: number;  // minimum value length to apply partial reveal (default: 8)
}

export interface MaskResult {
  key: string;
  original: string;
  masked: string;
}

export interface MaskReport {
  results: MaskResult[];
  totalMasked: number;
}

export function maskValue(
  value: string,
  options: MaskOptions = {}
): string {
  const { revealChars = 4, maskChar = '*', minLength = 8 } = options;

  if (value.length === 0) return value;

  if (value.length < minLength) {
    return maskChar.repeat(value.length);
  }

  const reveal = Math.min(revealChars, Math.floor(value.length / 2));
  const masked = maskChar.repeat(value.length - reveal);
  return masked + value.slice(value.length - reveal);
}

export function maskEnv(
  env: Record<string, string>,
  keys?: string[],
  options: MaskOptions = {}
): MaskReport {
  const targetKeys = keys ?? Object.keys(env);
  const results: MaskResult[] = [];

  for (const key of targetKeys) {
    if (!(key in env)) continue;
    const original = env[key];
    const masked = maskValue(original, options);
    results.push({ key, original, masked });
  }

  return {
    results,
    totalMasked: results.length,
  };
}

export function formatMaskReport(report: MaskReport): string {
  if (report.results.length === 0) {
    return 'No keys masked.';
  }

  const lines = report.results.map(
    (r) => `  ${r.key.padEnd(24)} ${r.masked}`
  );

  return [
    `Masked ${report.totalMasked} key(s):`,
    ...lines,
  ].join('\n');
}
