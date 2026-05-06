import { searchEnv } from '../../search/index';

describe('search command integration', () => {
  const vault: Record<string, string> = {
    DB_HOST: 'db.internal',
    DB_PORT: '5432',
    API_SECRET: 'topsecret',
    APP_ENV: 'production',
    FEATURE_FLAG: 'false',
  };

  it('finds a single key match', () => {
    const results = searchEnv(vault, 'DB_HOST', { exactMatch: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DB_HOST');
  });

  it('finds multiple keys with shared prefix', () => {
    const results = searchEnv(vault, 'DB');
    expect(results.length).toBe(2);
    const keys = results.map((r) => r.key);
    expect(keys).toContain('DB_HOST');
    expect(keys).toContain('DB_PORT');
  });

  it('finds value matches when searchValues enabled', () => {
    const results = searchEnv(vault, 'production', { searchValues: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('APP_ENV');
    expect(results[0].matchedOn).toBe('value');
  });

  it('returns empty when query matches nothing', () => {
    const results = searchEnv(vault, 'NOTHING_HERE');
    expect(results).toHaveLength(0);
  });

  it('handles case-insensitive search by default', () => {
    const results = searchEnv(vault, 'api_secret');
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('API_SECRET');
  });

  it('handles case-sensitive search correctly', () => {
    const lowerResults = searchEnv(vault, 'db_host', { caseSensitive: true });
    expect(lowerResults).toHaveLength(0);

    const upperResults = searchEnv(vault, 'DB_HOST', { caseSensitive: true });
    expect(upperResults).toHaveLength(1);
  });
});
