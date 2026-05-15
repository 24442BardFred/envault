import { groupEnv, formatGroupReport } from './group';

describe('groupEnv', () => {
  const env = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_NAME: 'mydb',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    APP_NAME: 'envault',
    PORT: '3000',
    NODE_ENV: 'test',
  };

  it('groups keys by prefix', () => {
    const result = groupEnv(env);
    expect(result.groups['DB']).toBeDefined();
    expect(Object.keys(result.groups['DB'])).toEqual(
      expect.arrayContaining(['DB_HOST', 'DB_PORT', 'DB_NAME'])
    );
    expect(result.groups['REDIS']).toBeDefined();
    expect(Object.keys(result.groups['REDIS'])).toEqual(
      expect.arrayContaining(['REDIS_HOST', 'REDIS_PORT'])
    );
  });

  it('places keys without underscores in ungrouped', () => {
    const result = groupEnv(env);
    expect(result.ungrouped['PORT']).toBe('3000');
  });

  it('moves small groups to ungrouped when below minGroupSize', () => {
    const result = groupEnv(env, 3);
    // REDIS has 2 keys, below minGroupSize=3 → ungrouped
    expect(result.groups['REDIS']).toBeUndefined();
    expect(result.ungrouped['REDIS_HOST']).toBe('localhost');
    expect(result.ungrouped['REDIS_PORT']).toBe('6379');
  });

  it('handles empty input', () => {
    const result = groupEnv({});
    expect(result.groups).toEqual({});
    expect(result.ungrouped).toEqual({});
  });

  it('places single-prefix keys in ungrouped with default minGroupSize=2', () => {
    const result = groupEnv({ SOLO_KEY: 'value', OTHER: 'x' });
    expect(result.groups['SOLO']).toBeUndefined();
    expect(result.ungrouped['SOLO_KEY']).toBe('value');
  });
});

describe('formatGroupReport', () => {
  it('returns correct counts', () => {
    const result = groupEnv({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      PORT: '3000',
    });
    const report = formatGroupReport(result);
    expect(report.totalKeys).toBe(3);
    expect(report.groupCount).toBe(1);
    expect(report.ungroupedCount).toBe(1);
    expect(report.groups['DB']).toEqual(['DB_HOST', 'DB_PORT']);
  });

  it('returns sorted keys within each group', () => {
    const result = groupEnv({ Z_B: '1', Z_A: '2', Z_C: '3' });
    const report = formatGroupReport(result);
    expect(report.groups['Z']).toEqual(['Z_A', 'Z_B', 'Z_C']);
  });
});
