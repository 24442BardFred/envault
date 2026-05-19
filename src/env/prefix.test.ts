import { prefixEnv, formatPrefixReport } from './prefix';

const sample: Record<string, string> = {
  APP_HOST: 'localhost',
  APP_PORT: '3000',
  DB_URL: 'postgres://localhost/db',
};

describe('prefixEnv — add', () => {
  it('adds a prefix to all keys', () => {
    const { result, report } = prefixEnv(sample, { add: 'MY_' });
    expect(result).toHaveProperty('MY_APP_HOST', 'localhost');
    expect(result).toHaveProperty('MY_APP_PORT', '3000');
    expect(result).toHaveProperty('MY_DB_URL', 'postgres://localhost/db');
    expect(report.added).toHaveLength(3);
    expect(report.unchanged).toHaveLength(0);
  });
});

describe('prefixEnv — remove', () => {
  it('removes a matching prefix from keys', () => {
    const { result, report } = prefixEnv(sample, { remove: 'APP_' });
    expect(result).toHaveProperty('HOST', 'localhost');
    expect(result).toHaveProperty('PORT', '3000');
    expect(result).toHaveProperty('DB_URL', 'postgres://localhost/db');
    expect(report.removed).toHaveLength(2);
    expect(report.unchanged).toHaveLength(1);
  });

  it('leaves key unchanged if removing prefix results in empty string', () => {
    const env = { APP_: 'value' };
    const { result, report } = prefixEnv(env, { remove: 'APP_' });
    expect(result).toHaveProperty('APP_', 'value');
    expect(report.unchanged).toContain('APP_');
  });
});

describe('prefixEnv — replace', () => {
  it('replaces a prefix on matching keys', () => {
    const { result, report } = prefixEnv(sample, { replace: { from: 'APP_', to: 'SVC_' } });
    expect(result).toHaveProperty('SVC_HOST', 'localhost');
    expect(result).toHaveProperty('SVC_PORT', '3000');
    expect(result).toHaveProperty('DB_URL', 'postgres://localhost/db');
    expect(report.replaced).toHaveLength(2);
    expect(report.unchanged).toHaveLength(1);
  });
});

describe('prefixEnv — no options', () => {
  it('returns env unchanged when no option is provided', () => {
    const { result, report } = prefixEnv(sample, {});
    expect(result).toEqual(sample);
    expect(report.unchanged).toHaveLength(3);
  });
});

describe('formatPrefixReport', () => {
  it('formats an add report', () => {
    const { report } = prefixEnv(sample, { add: 'X_' });
    const output = formatPrefixReport(report);
    expect(output).toContain('Added prefix:');
    expect(output).toContain('APP_HOST → X_APP_HOST');
  });

  it('formats an unchanged count', () => {
    const { report } = prefixEnv(sample, { remove: 'NOOP_' });
    const output = formatPrefixReport(report);
    expect(output).toContain('Unchanged: 3 key(s)');
  });
});
