import { describe, it, expect } from 'vitest';
import { maskValue, maskEnv, formatMaskReport } from './mask';

describe('maskValue', () => {
  it('fully masks short values (below minLength)', () => {
    expect(maskValue('abc', { minLength: 8 })).toBe('***');
  });

  it('partially reveals trailing chars for long values', () => {
    const result = maskValue('supersecret', { revealChars: 4, minLength: 8 });
    expect(result).toBe('*******cret');
  });

  it('uses custom mask character', () => {
    const result = maskValue('helloworld', { maskChar: '#', revealChars: 3, minLength: 4 });
    expect(result).toBe('#######rld');
  });

  it('returns empty string for empty input', () => {
    expect(maskValue('')).toBe('');
  });

  it('does not reveal more than half the value', () => {
    const result = maskValue('abcde', { revealChars: 10, minLength: 4 });
    // reveal capped at floor(5/2) = 2
    expect(result).toBe('***de');
  });
});

describe('maskEnv', () => {
  const env = {
    API_KEY: 'supersecretkey123',
    DB_PASSWORD: 'mydbpass',
    APP_NAME: 'envault',
  };

  it('masks all keys when no keys specified', () => {
    const report = maskEnv(env);
    expect(report.totalMasked).toBe(3);
    expect(report.results.find((r) => r.key === 'API_KEY')?.masked).not.toBe('supersecretkey123');
  });

  it('masks only specified keys', () => {
    const report = maskEnv(env, ['API_KEY']);
    expect(report.totalMasked).toBe(1);
    expect(report.results[0].key).toBe('API_KEY');
  });

  it('skips keys not present in env', () => {
    const report = maskEnv(env, ['MISSING_KEY']);
    expect(report.totalMasked).toBe(0);
  });

  it('preserves original value in result', () => {
    const report = maskEnv(env, ['DB_PASSWORD']);
    expect(report.results[0].original).toBe('mydbpass');
  });
});

describe('formatMaskReport', () => {
  it('returns message when no keys masked', () => {
    const output = formatMaskReport({ results: [], totalMasked: 0 });
    expect(output).toBe('No keys masked.');
  });

  it('formats report with key and masked value', () => {
    const output = formatMaskReport({
      results: [{ key: 'API_KEY', original: 'secretvalue', masked: '*******alue' }],
      totalMasked: 1,
    });
    expect(output).toContain('Masked 1 key(s)');
    expect(output).toContain('API_KEY');
    expect(output).toContain('*******alue');
  });
});
