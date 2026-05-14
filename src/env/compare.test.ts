import { compareEnv, formatCompareReport } from './compare';

describe('compareEnv', () => {
  const base = { A: '1', B: '2', C: '3' };
  const target = { A: '1', B: '99', D: '4' };

  it('detects unchanged keys', () => {
    const report = compareEnv(base, target);
    const entry = report.entries.find(e => e.key === 'A');
    expect(entry?.status).toBe('unchanged');
  });

  it('detects changed keys', () => {
    const report = compareEnv(base, target);
    const entry = report.entries.find(e => e.key === 'B');
    expect(entry?.status).toBe('changed');
    expect(entry?.baseValue).toBe('2');
    expect(entry?.targetValue).toBe('99');
  });

  it('detects removed keys', () => {
    const report = compareEnv(base, target);
    const entry = report.entries.find(e => e.key === 'C');
    expect(entry?.status).toBe('removed');
    expect(entry?.baseValue).toBe('3');
  });

  it('detects added keys', () => {
    const report = compareEnv(base, target);
    const entry = report.entries.find(e => e.key === 'D');
    expect(entry?.status).toBe('added');
    expect(entry?.targetValue).toBe('4');
  });

  it('produces correct counts', () => {
    const report = compareEnv(base, target);
    expect(report.added).toBe(1);
    expect(report.removed).toBe(1);
    expect(report.changed).toBe(1);
    expect(report.unchanged).toBe(1);
  });

  it('handles identical envs', () => {
    const report = compareEnv(base, base);
    expect(report.added).toBe(0);
    expect(report.removed).toBe(0);
    expect(report.changed).toBe(0);
    expect(report.unchanged).toBe(3);
  });

  it('handles empty base', () => {
    const report = compareEnv({}, { X: '1' });
    expect(report.added).toBe(1);
    expect(report.removed).toBe(0);
  });

  it('handles empty target', () => {
    const report = compareEnv({ X: '1' }, {});
    expect(report.added).toBe(0);
    expect(report.removed).toBe(1);
  });

  it('sorts entries alphabetically', () => {
    const report = compareEnv({ Z: '1', A: '2' }, { A: '2', M: '3' });
    const keys = report.entries.map(e => e.key);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('formatCompareReport', () => {
  it('excludes unchanged entries by default', () => {
    const report = compareEnv({ A: '1', B: '2' }, { A: '1', B: '99' });
    const output = formatCompareReport(report);
    expect(output).not.toContain(' A:');
    expect(output).toContain('~ B:');
  });

  it('includes unchanged entries when flag is set', () => {
    const report = compareEnv({ A: '1' }, { A: '1' });
    const output = formatCompareReport(report, true);
    expect(output).toContain('  A:');
  });

  it('includes summary line', () => {
    const report = compareEnv({ A: '1' }, { B: '2' });
    const output = formatCompareReport(report);
    expect(output).toContain('Summary:');
  });
});
