import { mergeEnv, formatMergeReport } from './merge';

describe('mergeEnv', () => {
  const base = { API_URL: 'http://localhost', PORT: '3000' };

  it('merges sources into base with overwrite strategy by default', () => {
    const { merged } = mergeEnv(base, {
      data: { PORT: '4000', DEBUG: 'true' },
    });
    expect(merged).toEqual({ API_URL: 'http://localhost', PORT: '4000', DEBUG: 'true' });
  });

  it('preserves existing keys with preserve strategy', () => {
    const { merged, skipped } = mergeEnv(base, {
      data: { PORT: '9999' },
      options: { strategy: 'preserve' },
    });
    expect(merged.PORT).toBe('3000');
    expect(skipped).toContain('PORT');
  });

  it('throws on conflict with error strategy', () => {
    expect(() =>
      mergeEnv(base, {
        data: { PORT: '9999' },
        options: { strategy: 'error' },
      })
    ).toThrow(/Merge conflict on key "PORT"/);
  });

  it('records conflicts in result', () => {
    const { conflicts } = mergeEnv(base, {
      data: { PORT: '8080' },
    });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ key: 'PORT', existing: '3000', incoming: '8080' });
  });

  it('skips empty values when ignoreEmpty is true', () => {
    const { merged, skipped } = mergeEnv(base, {
      data: { DEBUG: '' },
      options: { ignoreEmpty: true },
    });
    expect(merged.DEBUG).toBeUndefined();
    expect(skipped).toContain('DEBUG');
  });

  it('merges multiple sources in order', () => {
    const { merged } = mergeEnv(
      { A: '1' },
      { data: { A: '2', B: '2' } },
      { data: { B: '3', C: '3' } }
    );
    expect(merged).toEqual({ A: '2', B: '3', C: '3' });
  });

  it('returns no conflicts when all keys are new', () => {
    const { conflicts, merged } = mergeEnv(base, { data: { NEW_KEY: 'val' } });
    expect(conflicts).toHaveLength(0);
    expect(merged.NEW_KEY).toBe('val');
  });
});

describe('formatMergeReport', () => {
  it('reports no conflicts when clean', () => {
    const report = formatMergeReport({ merged: {}, conflicts: [], skipped: [] });
    expect(report).toContain('no conflicts');
  });

  it('lists conflicts and skipped keys', () => {
    const report = formatMergeReport({
      merged: {},
      conflicts: [{ key: 'PORT', existing: '3000', incoming: '9999' }],
      skipped: ['DEBUG'],
    });
    expect(report).toContain('PORT');
    expect(report).toContain('Skipped keys: DEBUG');
  });
});
