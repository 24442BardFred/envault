import { renameEnv, formatRenameReport, RenameEntry } from './rename';

describe('renameEnv', () => {
  const base = { DB_HOST: 'localhost', DB_PORT: '5432', APP_KEY: 'secret' };

  it('renames a single key, preserving value', () => {
    const { env, result } = renameEnv(base, [{ from: 'DB_HOST', to: 'DATABASE_HOST' }]);
    expect(env['DATABASE_HOST']).toBe('localhost');
    expect('DB_HOST' in env).toBe(false);
    expect(result.renamed).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.conflicts).toHaveLength(0);
  });

  it('renames multiple keys', () => {
    const renames: RenameEntry[] = [
      { from: 'DB_HOST', to: 'DATABASE_HOST' },
      { from: 'DB_PORT', to: 'DATABASE_PORT' },
    ];
    const { env, result } = renameEnv(base, renames);
    expect(env['DATABASE_HOST']).toBe('localhost');
    expect(env['DATABASE_PORT']).toBe('5432');
    expect(result.renamed).toHaveLength(2);
  });

  it('skips missing keys', () => {
    const { env, result } = renameEnv(base, [{ from: 'MISSING_KEY', to: 'NEW_KEY' }]);
    expect('NEW_KEY' in env).toBe(false);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].from).toBe('MISSING_KEY');
  });

  it('records conflict when target key already exists', () => {
    const { env, result } = renameEnv(base, [{ from: 'DB_HOST', to: 'APP_KEY' }]);
    expect(env['DB_HOST']).toBe('localhost'); // unchanged
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].to).toBe('APP_KEY');
  });

  it('does not mutate the original env object', () => {
    const original = { ...base };
    renameEnv(base, [{ from: 'DB_HOST', to: 'DATABASE_HOST' }]);
    expect(base).toEqual(original);
  });

  it('preserves keys not involved in rename', () => {
    const { env } = renameEnv(base, [{ from: 'DB_HOST', to: 'DATABASE_HOST' }]);
    expect(env['DB_PORT']).toBe('5432');
    expect(env['APP_KEY']).toBe('secret');
  });
});

describe('formatRenameReport', () => {
  it('formats a full report', () => {
    const result = {
      renamed: [{ from: 'DB_HOST', to: 'DATABASE_HOST' }],
      skipped: [{ from: 'MISSING', to: 'X' }],
      conflicts: [{ from: 'DB_PORT', to: 'APP_KEY' }],
    };
    const report = formatRenameReport(result);
    expect(report).toContain('DB_HOST → DATABASE_HOST');
    expect(report).toContain('MISSING');
    expect(report).toContain('APP_KEY');
  });

  it('returns empty string for empty result', () => {
    expect(formatRenameReport({ renamed: [], skipped: [], conflicts: [] })).toBe('');
  });
});
