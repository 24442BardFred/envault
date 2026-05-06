import { searchEnv } from './search';

const sampleEntries: Record<string, string> = {
  DATABASE_URL: 'postgres://localhost:5432/mydb',
  API_KEY: 'secret-api-key-12345',
  APP_PORT: '3000',
  REDIS_HOST: 'localhost',
  DEBUG: 'true',
};

describe('searchEnv', () => {
  it('finds keys matching query (case-insensitive by default)', () => {
    const results = searchEnv(sampleEntries, 'api');
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('API_KEY');
    expect(results[0].matchedOn).toBe('key');
  });

  it('is case-sensitive when option is set', () => {
    const results = searchEnv(sampleEntries, 'api', { caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('searches values when searchValues is true', () => {
    const results = searchEnv(sampleEntries, 'localhost', { searchValues: true });
    expect(results.length).toBeGreaterThanOrEqual(2);
    const keys = results.map((r) => r.key);
    expect(keys).toContain('DATABASE_URL');
    expect(keys).toContain('REDIS_HOST');
  });

  it('marks matchedOn as both when key and value match', () => {
    const entries = { localhost: 'localhost' };
    const results = searchEnv(entries, 'localhost', { searchValues: true });
    expect(results[0].matchedOn).toBe('both');
  });

  it('supports exact match on keys', () => {
    const results = searchEnv(sampleEntries, 'DEBUG', { exactMatch: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DEBUG');
  });

  it('returns empty array when nothing matches', () => {
    const results = searchEnv(sampleEntries, 'NONEXISTENT_KEY_XYZ');
    expect(results).toHaveLength(0);
  });

  it('returns multiple results for broad queries', () => {
    const results = searchEnv(sampleEntries, 'app', { caseSensitive: false });
    const keys = results.map((r) => r.key);
    expect(keys).toContain('APP_PORT');
  });
});
