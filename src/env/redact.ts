/**
 * Redact sensitive values in env records before display or logging.
 * Keys matching known sensitive patterns (e.g. PASSWORD, SECRET, TOKEN, KEY)
 * have their values replaced with a masked string.
 */

export interface RedactOptions {
  /** Custom regex patterns to match sensitive key names */
  patterns?: RegExp[];
  /** Replacement string (default: '********') */
  mask?: string;
  /** Show partial value — last N chars (default: 0, fully masked) */
  revealTail?: number;
}

const DEFAULT_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /passphrase/i,
];

export function isSensitiveKey(
  key: string,
  patterns: RegExp[] = DEFAULT_PATTERNS
): boolean {
  return patterns.some((re) => re.test(key));
}

export function redactValue(
  value: string,
  mask = '********',
  revealTail = 0
): string {
  if (revealTail > 0 && value.length > revealTail) {
    return mask + value.slice(-revealTail);
  }
  return mask;
}

export function redactEnv(
  env: Record<string, string>,
  options: RedactOptions = {}
): Record<string, string> {
  const {
    patterns = DEFAULT_PATTERNS,
    mask = '********',
    revealTail = 0,
  } = options;

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = isSensitiveKey(key, patterns)
      ? redactValue(value, mask, revealTail)
      : value;
  }
  return result;
}

export function formatRedactReport(
  original: Record<string, string>,
  redacted: Record<string, string>
): string {
  const lines: string[] = ['Redaction report:'];
  for (const key of Object.keys(original)) {
    if (original[key] !== redacted[key]) {
      lines.push(`  [REDACTED] ${key}`);
    }
  }
  if (lines.length === 1) lines.push('  No sensitive keys found.');
  return lines.join('\n');
}
