import { describe, it, expect } from 'vitest';
import {
  toUpperSnakeCase,
  uppercaseEnv,
  formatUppercaseReport,
} from './uppercase';

describe('toUpperSnakeCase', () => {
  it('leaves an already-uppercase key unchanged', () => {
    expect(toUpperSnakeCase('DATABASE_URL')).toBe('DATABASE_URL');
  });

  it('converts camelCase', () => {
    expect(toUpperSnakeCase('apiKey')).toBe('API_KEY');
  });

  it('converts PascalCase', () => {
    expect(toUpperSnakeCase('DatabaseUrl')).toBe('DATABASE_URL');
  });

  it('converts kebab-case', () => {
    expect(toUpperSnakeCase('api-key')).toBe('API_KEY');
  });

  it('converts dot.notation', () => {
    expect(toUpperSnakeCase('db.host')).toBe('DB_HOST');
  });

  it('handles mixed separators', () => {
    expect(toUpperSnakeCase('my-api.Key')).toBe('MY_API_KEY');
  });
});

describe('uppercaseEnv', () => {
  it('renames lowercase keys', () => {
    const { result, changed, skipped } = uppercaseEnv({
      apiKey: 'abc',
      db_host: 'localhost',
    });
    expect(result).toEqual({ API_KEY: 'abc', DB_HOST: 'localhost' });
    expect(changed).toHaveLength(2);
    expect(skipped).toHaveLength(0);
  });

  it('does not rename already-uppercase keys', () => {
    const { result, changed } = uppercaseEnv({ PORT: '3000' });
    expect(result).toEqual({ PORT: '3000' });
    expect(changed).toHaveLength(0);
  });

  it('skips colliding keys and keeps the first', () => {
    const { result, skipped } = uppercaseEnv({
      api_key: 'first',
      API_KEY: 'second',
    });
    // 'api_key' is processed first and becomes API_KEY
    expect(result['API_KEY']).toBe('first');
    expect(skipped).toContain('API_KEY');
  });

  it('returns an empty result for an empty input', () => {
    const { result, changed, skipped } = uppercaseEnv({});
    expect(result).toEqual({});
    expect(changed).toHaveLength(0);
    expect(skipped).toHaveLength(0);
  });
});

describe('formatUppercaseReport', () => {
  it('reports no changes when all keys are already uppercase', () => {
    const report = uppercaseEnv({ PORT: '3000' });
    expect(formatUppercaseReport(report)).toMatch(/already uppercase/i);
  });

  it('lists renamed keys', () => {
    const report = uppercaseEnv({ apiKey: 'x' });
    const output = formatUppercaseReport(report);
    expect(output).toMatch('apiKey');
    expect(output).toMatch('API_KEY');
  });

  it('lists skipped keys', () => {
    const report = uppercaseEnv({ api_key: 'a', API_KEY: 'b' });
    const output = formatUppercaseReport(report);
    expect(output).toMatch(/skipped/i);
  });
});
