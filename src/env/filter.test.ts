import { filterEnv, formatFilterReport } from './filter';

const sampleEnv: Record<string, string> = {
  DATABASE_URL: 'postgres://localhost/mydb',
  DATABASE_POOL: '10',
  REDIS_URL: 'redis://localhost:6379',
  APP_SECRET: 'supersecret',
  APP_PORT: '3000',
  DEBUG: 'true',
};

describe('filterEnv', () => {
  it('returns all entries when no options given', () => {
    const result = filterEnv(sampleEnv, {});
    expect(result.matched).toBe(6);
    expect(result.total).toBe(6);
  });

  it('filters by key prefix', () => {
    const result = filterEnv(sampleEnv, { prefix: 'DATABASE_' });
    expect(result.matched).toBe(2);
    expect(result.entries).toHaveProperty('DATABASE_URL');
    expect(result.entries).toHaveProperty('DATABASE_POOL');
  });

  it('filters by key pattern (regex)', () => {
    const result = filterEnv(sampleEnv, { keyPattern: 'url' });
    expect(result.matched).toBe(2);
    expect(result.entries).toHaveProperty('DATABASE_URL');
    expect(result.entries).toHaveProperty('REDIS_URL');
  });

  it('filters by value pattern', () => {
    const result = filterEnv(sampleEnv, { valuePattern: '^\\d+$' });
    expect(result.matched).toBe(2);
    expect(result.entries).toHaveProperty('DATABASE_POOL');
    expect(result.entries).toHaveProperty('APP_PORT');
  });

  it('inverts filter results', () => {
    const result = filterEnv(sampleEnv, { prefix: 'DATABASE_', invert: true });
    expect(result.matched).toBe(4);
    expect(result.entries).not.toHaveProperty('DATABASE_URL');
  });

  it('combines prefix and keyPattern', () => {
    const result = filterEnv(sampleEnv, { prefix: 'APP_', keyPattern: 'port' });
    expect(result.matched).toBe(1);
    expect(result.entries).toHaveProperty('APP_PORT');
  });

  it('returns empty entries when nothing matches', () => {
    const result = filterEnv(sampleEnv, { keyPattern: 'NONEXISTENT' });
    expect(result.matched).toBe(0);
    expect(result.entries).toEqual({});
  });
});

describe('formatFilterReport', () => {
  it('formats matched entries', () => {
    const result = filterEnv(sampleEnv, { prefix: 'DEBUG' });
    const output = formatFilterReport(result);
    expect(output).toContain('Matched 1 of 6');
    expect(output).toContain('DEBUG=true');
  });

  it('shows no matches message when empty', () => {
    const result = filterEnv(sampleEnv, { keyPattern: 'NOTHING' });
    const output = formatFilterReport(result);
    expect(output).toContain('(no matches)');
  });
});
