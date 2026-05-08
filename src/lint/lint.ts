import { EnvRecord } from '../env/parser';

export type LintSeverity = 'error' | 'warn' | 'info';

export interface LintRule {
  name: string;
  severity: LintSeverity;
  check: (key: string, value: string) => string | null;
}

export interface LintIssue {
  key: string;
  rule: string;
  severity: LintSeverity;
  message: string;
}

export const defaultRules: LintRule[] = [
  {
    name: 'no-empty-value',
    severity: 'warn',
    check: (key, value) =>
      value.trim() === '' ? `Key "${key}" has an empty value.` : null,
  },
  {
    name: 'no-quotes-in-value',
    severity: 'warn',
    check: (key, value) =>
      /^["'].*["']$/.test(value)
        ? `Key "${key}" value is wrapped in quotes — these will be treated as literals.`
        : null,
  },
  {
    name: 'uppercase-key',
    severity: 'info',
    check: (key) =>
      key !== key.toUpperCase()
        ? `Key "${key}" is not uppercase — convention recommends ALL_CAPS.`
        : null,
  },
  {
    name: 'no-spaces-in-key',
    severity: 'error',
    check: (key) =>
      /\s/.test(key) ? `Key "${key}" contains whitespace, which is invalid.` : null,
  },
  {
    name: 'no-special-chars-in-key',
    severity: 'error',
    check: (key) =>
      /[^A-Za-z0-9_]/.test(key)
        ? `Key "${key}" contains special characters. Only letters, digits, and underscores are allowed.`
        : null,
  },
];

export function lintEnv(
  env: EnvRecord,
  rules: LintRule[] = defaultRules
): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const [key, value] of Object.entries(env)) {
    for (const rule of rules) {
      const message = rule.check(key, value);
      if (message) {
        issues.push({ key, rule: rule.name, severity: rule.severity, message });
      }
    }
  }
  return issues;
}

export function formatLintResults(issues: LintIssue[]): string {
  if (issues.length === 0) return 'No lint issues found.';
  return issues
    .map((i) => `[${i.severity.toUpperCase()}] ${i.message} (rule: ${i.rule})`)
    .join('\n');
}
