import { validateEnv, formatValidationReport, ValidationRule } from './validate';

describe('validateEnv', () => {
  const rules: ValidationRule[] = [
    { key: 'DATABASE_URL', required: true },
    { key: 'PORT', required: true, pattern: /^\d+$/, minLength: 1, maxLength: 5 },
    { key: 'NODE_ENV', required: true, allowedValues: ['development', 'production', 'test'] },
    { key: 'API_KEY', required: false, minLength: 16 },
  ];

  it('returns valid report when all rules pass', () => {
    const env = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: '3000',
      NODE_ENV: 'production',
      API_KEY: 'abcdefghijklmnop',
    };
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(true);
    expect(report.results.every((r) => r.valid)).toBe(true);
  });

  it('fails when required key is missing', () => {
    const env = {
      PORT: '3000',
      NODE_ENV: 'development',
    };
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
    const dbResult = report.results.find((r) => r.key === 'DATABASE_URL');
    expect(dbResult?.valid).toBe(false);
    expect(dbResult?.errors[0]).toMatch(/required/);
  });

  it('fails when pattern does not match', () => {
    const env = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: 'not-a-number',
      NODE_ENV: 'production',
    };
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
    const portResult = report.results.find((r) => r.key === 'PORT');
    expect(portResult?.errors.some((e) => e.includes('pattern'))).toBe(true);
  });

  it('fails when value not in allowedValues', () => {
    const env = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: '8080',
      NODE_ENV: 'staging',
    };
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
    const envResult = report.results.find((r) => r.key === 'NODE_ENV');
    expect(envResult?.errors.some((e) => e.includes('one of'))).toBe(true);
  });

  it('fails when optional key is present but too short', () => {
    const env = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: '3000',
      NODE_ENV: 'test',
      API_KEY: 'short',
    };
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
    const apiResult = report.results.find((r) => r.key === 'API_KEY');
    expect(apiResult?.errors.some((e) => e.includes('at least'))).toBe(true);
  });

  it('passes when optional key is absent', () => {
    const env = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: '3000',
      NODE_ENV: 'test',
    };
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(true);
  });
});

describe('formatValidationReport', () => {
  it('returns success message for valid report', () => {
    const report = { valid: true, results: [] };
    expect(formatValidationReport(report)).toContain('✅');
  });

  it('returns failure details for invalid report', () => {
    const report = {
      valid: false,
      results: [
        { key: 'DATABASE_URL', valid: false, errors: ['Key "DATABASE_URL" is required but missing or empty.'] },
      ],
    };
    const output = formatValidationReport(report);
    expect(output).toContain('❌');
    expect(output).toContain('DATABASE_URL');
  });
});
