import { cloneEnv, formatCloneReport } from './clone';

const baseEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  API_KEY: 'secret',
  APP_NAME: 'envault',
};

describe('cloneEnv', () => {
  it('adds a prefix to all keys by default', () => {
    const { result, report } = cloneEnv(baseEnv, { prefix: 'STAGING_' });
    expect(result['STAGING_DB_HOST']).toBe('localhost');
    expect(result['STAGING_API_KEY']).toBe('secret');
    expect(report.cloned).toHaveLength(4);
    expect(report.skipped).toHaveLength(0);
  });

  it('adds a suffix to all keys', () => {
    const { result, report } = cloneEnv(baseEnv, { suffix: '_BACKUP' });
    expect(result['DB_HOST_BACKUP']).toBe('localhost');
    expect(report.cloned).toHaveLength(4);
  });

  it('clones only specified keys', () => {
    const { result, report } = cloneEnv(baseEnv, { prefix: 'OLD_', keys: ['DB_HOST', 'DB_PORT'] });
    expect(result['OLD_DB_HOST']).toBe('localhost');
    expect(result['OLD_DB_PORT']).toBe('5432');
    expect(result['OLD_API_KEY']).toBeUndefined();
    expect(report.cloned).toHaveLength(2);
  });

  it('skips keys not found in source', () => {
    const { report } = cloneEnv(baseEnv, { prefix: 'X_', keys: ['MISSING_KEY'] });
    expect(report.skipped).toHaveLength(1);
    expect(report.skipped[0].reason).toMatch(/not found/);
  });

  it('skips when source and destination keys are identical (no prefix/suffix)', () => {
    const { report } = cloneEnv(baseEnv, {});
    expect(report.skipped).toHaveLength(4);
    expect(report.skipped[0].reason).toMatch(/identical/);
  });

  it('skips existing destination key without overwrite', () => {
    const env = { ...baseEnv, STAGING_DB_HOST: 'prod' };
    const { result, report } = cloneEnv(env, { prefix: 'STAGING_', keys: ['DB_HOST'] });
    expect(result['STAGING_DB_HOST']).toBe('prod');
    expect(report.skipped[0].reason).toMatch(/already exists/);
  });

  it('overwrites existing destination key when overwrite is true', () => {
    const env = { ...baseEnv, STAGING_DB_HOST: 'old' };
    const { result, report } = cloneEnv(env, { prefix: 'STAGING_', keys: ['DB_HOST'], overwrite: true });
    expect(result['STAGING_DB_HOST']).toBe('localhost');
    expect(report.cloned).toHaveLength(1);
  });

  it('preserves original keys', () => {
    const { result } = cloneEnv(baseEnv, { prefix: 'COPY_' });
    expect(result['DB_HOST']).toBe('localhost');
  });
});

describe('formatCloneReport', () => {
  it('formats cloned and skipped entries', () => {
    const { report } = cloneEnv(baseEnv, { prefix: 'NEW_', keys: ['DB_HOST'] });
    const output = formatCloneReport(report);
    expect(output).toContain('Cloned');
    expect(output).toContain('DB_HOST → NEW_DB_HOST');
  });

  it('shows no keys cloned message when nothing happened', () => {
    const output = formatCloneReport({ cloned: [], skipped: [] });
    expect(output).toBe('No keys cloned.');
  });
});
