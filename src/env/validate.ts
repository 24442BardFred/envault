import { parseEnv } from './parser';

export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
}

export interface ValidationResult {
  key: string;
  valid: boolean;
  errors: string[];
}

export interface ValidationReport {
  passed: boolean;
  results: ValidationResult[];
}

export function validateEnv(
  raw: string,
  rules: ValidationRule[]
): ValidationReport {
  const env = parseEnv(raw);
  const results: ValidationResult[] = [];

  for (const rule of rules) {
    const errors: string[] = [];
    const value = env[rule.key];

    if (rule.required && (value === undefined || value === '')) {
      errors.push(`Key "${rule.key}" is required but missing or empty.`);
    }

    if (value !== undefined && value !== '') {
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(
          `Key "${rule.key}" does not match pattern ${rule.pattern}.`
        );
      }

      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(
          `Key "${rule.key}" must be at least ${rule.minLength} characters.`
        );
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(
          `Key "${rule.key}" must be at most ${rule.maxLength} characters.`
        );
      }

      if (
        rule.allowedValues &&
        !rule.allowedValues.includes(value)
      ) {
        errors.push(
          `Key "${rule.key}" must be one of: ${rule.allowedValues.join(', ')}.`
        );
      }
    }

    results.push({ key: rule.key, valid: errors.length === 0, errors });
  }

  return {
    passed: results.every((r) => r.valid),
    results,
  };
}

export function formatValidationReport(report: ValidationReport): string {
  if (report.passed) return '✔ All validation rules passed.';

  const lines: string[] = ['✖ Validation failed:'];
  for (const result of report.results) {
    for (const err of result.errors) {
      lines.push(`  - ${err}`);
    }
  }
  return lines.join('\n');
}
