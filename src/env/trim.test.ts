import { trimEnv, trimValue, formatTrimReport } from './trim';

describe('trimValue', () => {
  it('trims leading and trailing whitespace', () => {
    expect(trimValue('  hello  ', false)).toBe('hello');
  });

  it('does not strip quotes when stripQuotes is false', () => {
    expect(trimValue('"hello"', false)).toBe('"hello"');
  });

  it('strips double quotes when stripQuotes is true', () => {
    expect(trimValue('"hello"', true)).toBe('hello');
  });

  it('strips single quotes when stripQuotes is true', () => {
    expect(trimValue("'world'", true)).toBe('world');
  });

  it('trims whitespace inside quotes after stripping', () => {
    expect(trimValue('" spaced "', true)).toBe('spaced');
  });

  it('does not strip mismatched quotes', () => {
    expect(trimValue('"hello\'', true)).toBe('"hello\'');
  });
});

describe('trimEnv', () => {
  const env = {
    A: '  hello  ',
    B: '"quoted"',
    C: 'clean',
    D: '  " padded quote "  ',
  };

  it('trims all values by default', () => {
    const { result } = trimEnv(env);
    expect(result.A).toBe('hello');
    expect(result.B).toBe('"quoted"');
    expect(result.C).toBe('clean');
  });

  it('strips quotes when stripQuotes is true', () => {
    const { result } = trimEnv(env, { stripQuotes: true });
    expect(result.B).toBe('quoted');
    expect(result.D).toBe('padded quote');
  });

  it('only trims specified keys', () => {
    const { result, report } = trimEnv(env, { keys: ['A'] });
    expect(result.A).toBe('hello');
    expect(result.B).toBe('"quoted"');
    expect(report.unchanged).toContain('B');
    expect(report.unchanged).toContain('C');
  });

  it('reports trimmed keys correctly', () => {
    const { report } = trimEnv(env);
    expect(report.trimmed).toHaveProperty('A');
    expect(report.trimmed.A.before).toBe('  hello  ');
    expect(report.trimmed.A.after).toBe('hello');
    expect(report.unchanged).toContain('C');
  });

  it('reports no trimmed keys when all values are clean', () => {
    const { report } = trimEnv({ X: 'ok', Y: 'fine' });
    expect(Object.keys(report.trimmed)).toHaveLength(0);
    expect(report.unchanged).toEqual(['X', 'Y']);
  });
});

describe('formatTrimReport', () => {
  it('shows a message when nothing was trimmed', () => {
    const output = formatTrimReport({ trimmed: {}, unchanged: ['A'] });
    expect(output).toContain('No values required trimming');
  });

  it('lists trimmed keys with before/after', () => {
    const output = formatTrimReport({
      trimmed: { A: { before: '  hi  ', after: 'hi' } },
      unchanged: [],
    });
    expect(output).toContain('A');
    expect(output).toContain('"  hi  "');
    expect(output).toContain('"hi"');
  });
});
