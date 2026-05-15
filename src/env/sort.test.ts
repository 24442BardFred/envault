import { sortEnv, formatSortReport } from './sort';

const sampleEnv: Record<string, string> = {
  ZEBRA: 'z',
  APP_NAME: 'myapp',
  DB_HOST: 'localhost',
  APP_PORT: '3000',
  DB_PASS: 'secret',
  ALPHA: 'a',
};

describe('sortEnv', () => {
  it('sorts keys in ascending order by default', () => {
    const { keyOrder } = sortEnv(sampleEnv);
    expect(keyOrder).toEqual(['ALPHA', 'APP_NAME', 'APP_PORT', 'DB_HOST', 'DB_PASS', 'ZEBRA']);
  });

  it('sorts keys in descending order', () => {
    const { keyOrder } = sortEnv(sampleEnv, { order: 'desc' });
    expect(keyOrder).toEqual(['ZEBRA', 'DB_PASS', 'DB_HOST', 'APP_PORT', 'APP_NAME', 'ALPHA']);
  });

  it('groups by prefix when option is set', () => {
    const { keyOrder } = sortEnv(sampleEnv, { groupByPrefix: true });
    const appKeys = keyOrder.filter((k) => k.startsWith('APP_'));
    const dbKeys = keyOrder.filter((k) => k.startsWith('DB_'));
    expect(appKeys).toEqual(['APP_NAME', 'APP_PORT']);
    expect(dbKeys).toEqual(['DB_HOST', 'DB_PASS']);
    // APP group should appear before DB group (asc)
    expect(keyOrder.indexOf('APP_NAME')).toBeLessThan(keyOrder.indexOf('DB_HOST'));
  });

  it('preserves all key-value pairs in sorted output', () => {
    const { sorted } = sortEnv(sampleEnv);
    expect(Object.keys(sorted).length).toBe(Object.keys(sampleEnv).length);
    for (const [k, v] of Object.entries(sampleEnv)) {
      expect(sorted[k]).toBe(v);
    }
  });

  it('reports changed as false when already sorted', () => {
    const alreadySorted = { ALPHA: 'a', BETA: 'b', GAMMA: 'g' };
    const { changed } = sortEnv(alreadySorted);
    expect(changed).toBe(false);
  });

  it('reports changed as true when order differs', () => {
    const { changed } = sortEnv(sampleEnv);
    expect(changed).toBe(true);
  });
});

describe('formatSortReport', () => {
  it('returns no-change message when already sorted', () => {
    const report = sortEnv({ A: '1', B: '2' });
    expect(formatSortReport(report)).toContain('already in sorted order');
  });

  it('lists sorted keys when changes were made', () => {
    const report = sortEnv(sampleEnv);
    const output = formatSortReport(report);
    expect(output).toContain('Sorted environment keys');
    expect(output).toContain('ALPHA');
    expect(output).toContain('ZEBRA');
  });
});
