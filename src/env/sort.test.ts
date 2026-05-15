import { sortEnv, formatSortReport } from './sort';

const sampleEnv = `ZEBRA=1\nAPPLE=2\nMango=3\nbanana=4`;

describe('sortEnv', () => {
  it('sorts keys alphabetically ascending by default', () => {
    const { output, report } = sortEnv(sampleEnv);
    expect(report.sorted[0]).toBe('APPLE');
    expect(report.changed).toBe(true);
    expect(output).toContain('APPLE=2');
  });

  it('sorts keys alphabetically descending', () => {
    const { report } = sortEnv(sampleEnv, { order: 'desc' });
    expect(report.sorted[0]).toBe('ZEBRA');
  });

  it('sorts keys by length ascending', () => {
    const { report } = sortEnv(sampleEnv, { strategy: 'length' });
    expect(report.sorted[0]).toBe('ZEBRA');
  });

  it('sorts keys using natural sort', () => {
    const input = 'KEY10=a\nKEY2=b\nKEY1=c';
    const { report } = sortEnv(input, { strategy: 'natural' });
    expect(report.sorted).toEqual(['KEY1', 'KEY2', 'KEY10']);
  });

  it('reports no change when already sorted', () => {
    const input = 'ALPHA=1\nBETA=2\nGAMMA=3';
    const { report } = sortEnv(input);
    expect(report.changed).toBe(false);
  });

  it('preserves values after sorting', () => {
    const { output } = sortEnv(sampleEnv);
    expect(output).toContain('ZEBRA=1');
    expect(output).toContain('APPLE=2');
  });
});

describe('formatSortReport', () => {
  it('reports no change when unchanged', () => {
    const msg = formatSortReport({ original: ['A', 'B'], sorted: ['A', 'B'], changed: false });
    expect(msg).toMatch(/already in the desired order/);
  });

  it('shows before and after when changed', () => {
    const msg = formatSortReport({ original: ['B', 'A'], sorted: ['A', 'B'], changed: true });
    expect(msg).toMatch(/Before/);
    expect(msg).toMatch(/After/);
    expect(msg).toContain('A, B');
  });
});
