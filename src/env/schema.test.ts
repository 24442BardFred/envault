import { describe, it, expect } from 'vitest';
import {
  validateWithSchema,
  formatSchemaReport,
  EnvSchema,
} from './schema';

const schema: EnvSchema = {
  PORT: { type: 'number', required: true },
  APP_URL: { type: 'url', required: true },
  ADMIN_EMAIL: { type: 'email', required: false },
  DEBUG: { type: 'boolean', required: false },
  APP_NAME: { type: 'string', required: true, pattern: '^[A-Z_]+$' },
};

describe('validateWithSchema', () => {
  it('returns no violations for a valid env', () => {
    const env = {
      PORT: '3000',
      APP_URL: 'https://example.com',
      ADMIN_EMAIL: 'admin@example.com',
      DEBUG: 'true',
      APP_NAME: 'MY_APP',
    };
    expect(validateWithSchema(env, schema)).toHaveLength(0);
  });

  it('reports missing required fields', () => {
    const env = { APP_URL: 'https://example.com', APP_NAME: 'MY_APP' };
    const violations = validateWithSchema(env, schema);
    expect(violations.some((v) => v.key === 'PORT')).toBe(true);
  });

  it('does not report missing optional fields', () => {
    const env = { PORT: '8080', APP_URL: 'https://x.com', APP_NAME: 'APP' };
    const violations = validateWithSchema(env, schema);
    expect(violations.some((v) => v.key === 'ADMIN_EMAIL')).toBe(false);
  });

  it('reports invalid type for number', () => {
    const env = { PORT: 'abc', APP_URL: 'https://x.com', APP_NAME: 'APP' };
    const violations = validateWithSchema(env, schema);
    expect(violations.some((v) => v.key === 'PORT')).toBe(true);
  });

  it('reports invalid url', () => {
    const env = { PORT: '3000', APP_URL: 'not-a-url', APP_NAME: 'APP' };
    const violations = validateWithSchema(env, schema);
    expect(violations.some((v) => v.key === 'APP_URL')).toBe(true);
  });

  it('reports pattern mismatch', () => {
    const env = { PORT: '3000', APP_URL: 'https://x.com', APP_NAME: 'my-app' };
    const violations = validateWithSchema(env, schema);
    expect(violations.some((v) => v.key === 'APP_NAME')).toBe(true);
  });
});

describe('formatSchemaReport', () => {
  it('returns pass message when no violations', () => {
    expect(formatSchemaReport([])).toBe('Schema validation passed.');
  });

  it('includes violation reasons in output', () => {
    const violations = [{ key: 'PORT', reason: 'Required field "PORT" is missing' }];
    const report = formatSchemaReport(violations);
    expect(report).toContain('Schema validation failed');
    expect(report).toContain('PORT');
  });
});
