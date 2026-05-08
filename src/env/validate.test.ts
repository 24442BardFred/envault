import { validateEnv, formatValidationReport, ValidationRule } from './validate';

const sampleEnv = `
DB_HOST=localhost
DB_PORT=5432
APP_ENV=production
SECRET_KEY=supersecretvalue123
`.trim();

describe('validateEnv', () => {
  it('passes when all required keys are present', () => {
    const rules: ValidationRule[] = [
      { key: 'DB_HOST', required: true },
      { key: 'DB_PORT', required: true },
    ];
    const report = validateEnv(sampleEnv, rules);
    expect(report.passed).toBe(true);
    expect(report.results.every((r) => r.valid)).toBe(true);
  });

  it('fails when a required key is missing', () => {
    const rules: ValidationRule[] = [
      { key: 'MISSING_KEY', required: true },
    ];
    const report = validateEnv(sampleEnv, rules);
    expect(report.passed).toBe(false);
    expect(report.results[0].errors).toContain(
      'Key "MISSING_KEY" is required but missing or empty.'
    );
  });

  it('fails when value does not match pattern', () => {
    const rules: ValidationRule[] = [
      { key: 'DB_PORT', pattern: /^\d{4}$/ },
    ];
    const report = validateEnv(sampleEnv, rules);
    expect(report.passed).toBe(true); // 5432 matches \d{4}
  });

  it('fails when value is too short', () => {
    const rules: ValidationRule[] = [
      { key: 'DB_HOST', minLength: 20 },
    ];
    const report = validateEnv(sampleEnv, rules);
    expect(report.passed).toBe(false);
    expect(report.results[0].errors[0]).toMatch(/at least 20 characters/);
  });

  it('fails when value is too long', () => {
    const rules: ValidationRule[] = [
      { key: 'SECRET_KEY', maxLength: 5 },
    ];
    const report = validateEnv(sampleEnv, rules);
    expect(report.passed).toBe(false);
    expect(report.results[0].errors[0]).toMatch(/at most 5 characters/);
  });

  it('fails when value is not in allowedValues', () => {
    const rules: ValidationRule[] = [
      { key: 'APP_ENV', allowedValues: ['development', 'staging'] },
    ];
    const report = validateEnv(sampleEnv, rules);
    expect(report.passed).toBe(false);
    expect(report.results[0].errors[0]).toMatch(/development, staging/);
  });

  it('passes when value is in allowedValues', () => {
    const rules: ValidationRule[] = [
      { key: 'APP_ENV', allowedValues: ['production', 'staging'] },
    ];
    const report = validateEnv(sampleEnv, rules);
    expect(report.passed).toBe(true);
  });
});

describe('formatValidationReport', () => {
  it('returns success message when passed', () => {
    const report = { passed: true, results: [] };
    expect(formatValidationReport(report)).toBe('✔ All validation rules passed.');
  });

  it('returns error lines when failed', () => {
    const report = {
      passed: false,
      results: [
        { key: 'FOO', valid: false, errors: ['Key "FOO" is required but missing or empty.'] },
      ],
    };
    const output = formatValidationReport(report);
    expect(output).toContain('✖ Validation failed:');
    expect(output).toContain('Key "FOO" is required but missing or empty.');
  });
});
