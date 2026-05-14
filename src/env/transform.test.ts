import { transformEnv, formatTransformReport, getBuiltinTransformers } from './transform';

const sampleEnv = {
  APP_NAME: 'MyApp',
  SECRET_KEY: 'hello world',
  DEBUG: 'true',
};

describe('getBuiltinTransformers', () => {
  it('returns a non-empty list', () => {
    const list = getBuiltinTransformers();
    expect(list.length).toBeGreaterThan(0);
    expect(list).toContain('uppercase');
    expect(list).toContain('base64encode');
  });
});

describe('transformEnv', () => {
  it('applies uppercase to all keys', () => {
    const result = transformEnv(sampleEnv, 'uppercase');
    expect(result.transformed.APP_NAME).toBe('MYAPP');
    expect(result.transformed.SECRET_KEY).toBe('HELLO WORLD');
    expect(result.errors).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });

  it('applies lowercase to specific keys', () => {
    const result = transformEnv(sampleEnv, 'lowercase', ['APP_NAME']);
    expect(result.transformed.APP_NAME).toBe('myapp');
    expect(result.transformed.SECRET_KEY).toBe('hello world');
  });

  it('base64 encodes and decodes round-trip', () => {
    const encoded = transformEnv(sampleEnv, 'base64encode', ['SECRET_KEY']);
    const decoded = transformEnv(encoded.transformed, 'base64decode', ['SECRET_KEY']);
    expect(decoded.transformed.SECRET_KEY).toBe('hello world');
  });

  it('skips keys not present in env', () => {
    const result = transformEnv(sampleEnv, 'trim', ['MISSING_KEY']);
    expect(result.skipped).toContain('MISSING_KEY');
  });

  it('throws on unknown transformer', () => {
    expect(() => transformEnv(sampleEnv, 'nonexistent')).toThrow('Unknown transformer');
  });

  it('supports custom transform function', () => {
    const result = transformEnv(sampleEnv, 'custom', ['APP_NAME'], (v) => v.split('').reverse().join(''));
    expect(result.transformed.APP_NAME).toBe('ppAyM');
  });

  it('captures errors from failing transform', () => {
    const result = transformEnv(sampleEnv, 'custom', ['APP_NAME'], () => { throw new Error('boom'); });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe('APP_NAME');
  });
});

describe('formatTransformReport', () => {
  it('formats a clean report', () => {
    const result = transformEnv(sampleEnv, 'trim');
    const report = formatTransformReport(result);
    expect(report).toContain('Transformed:');
  });

  it('includes skipped keys in report', () => {
    const result = transformEnv(sampleEnv, 'trim', ['GHOST']);
    const report = formatTransformReport(result);
    expect(report).toContain('GHOST');
  });
});
