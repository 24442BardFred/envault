import { groupEnv, formatGroupReport } from './group';

const sampleEnv: Record<string, string> = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'mydb',
  APP_NAME: 'envault',
  APP_ENV: 'production',
  SECRET: 'topsecret',
};

describe('groupEnv', () => {
  it('groups keys by underscore prefix by default', () => {
    const report = groupEnv(sampleEnv);
    expect(report.groups['DB']).toEqual({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'mydb',
    });
    expect(report.groups['APP']).toEqual({
      APP_NAME: 'envault',
      APP_ENV: 'production',
    });
  });

  it('places keys with no delimiter match in ungrouped', () => {
    const report = groupEnv(sampleEnv);
    expect(report.ungrouped).toContain('SECRET');
  });

  it('respects a custom delimiter', () => {
    const env = { 'DB.HOST': 'localhost', 'DB.PORT': '5432', PLAIN: 'yes' };
    const report = groupEnv(env, '.');
    expect(report.groups['DB']).toEqual({ 'DB.HOST': 'localhost', 'DB.PORT': '5432' });
    expect(report.ungrouped).toContain('PLAIN');
    expect(report.delimiter).toBe('.');
  });

  it('returns empty groups for empty env', () => {
    const report = groupEnv({});
    expect(Object.keys(report.groups)).toHaveLength(0);
    expect(report.ungrouped).toHaveLength(0);
  });

  it('handles env where all keys have no prefix', () => {
    const env = { FOO: '1', BAR: '2' };
    const report = groupEnv(env);
    expect(Object.keys(report.groups)).toHaveLength(0);
    expect(report.ungrouped).toEqual(expect.arrayContaining(['FOO', 'BAR']));
  });
});

describe('formatGroupReport', () => {
  it('includes group names and keys in output', () => {
    const report = groupEnv(sampleEnv);
    const output = formatGroupReport(report);
    expect(output).toContain('DB');
    expect(output).toContain('DB_HOST');
    expect(output).toContain('APP');
    expect(output).toContain('APP_NAME');
  });

  it('mentions ungrouped keys', () => {
    const report = groupEnv(sampleEnv);
    const output = formatGroupReport(report);
    expect(output).toContain('SECRET');
  });

  it('returns a non-empty string for empty env', () => {
    const report = groupEnv({});
    const output = formatGroupReport(report);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
});
