import { applyDefaults, formatDefaultsReport } from './defaults';

describe('applyDefaults', () => {
  it('applies defaults for missing keys', () => {
    const env = { FOO: 'bar' };
    const defaults = { FOO: 'default_foo', BAZ: 'default_baz' };
    const { result, report } = applyDefaults(env, defaults);
    expect(result.FOO).toBe('bar');
    expect(result.BAZ).toBe('default_baz');
    expect(report.applied).toEqual({ BAZ: 'default_baz' });
    expect(report.skipped).toContain('FOO');
  });

  it('overwrites empty values when overwriteEmpty is true', () => {
    const env = { FOO: '' };
    const defaults = { FOO: 'filled' };
    const { result, report } = applyDefaults(env, defaults, true);
    expect(result.FOO).toBe('filled');
    expect(report.applied).toEqual({ FOO: 'filled' });
  });

  it('does not overwrite empty values when overwriteEmpty is false', () => {
    const env = { FOO: '' };
    const defaults = { FOO: 'filled' };
    const { result, report } = applyDefaults(env, defaults, false);
    expect(result.FOO).toBe('');
    expect(report.skipped).toContain('FOO');
  });

  it('does not modify original env object', () => {
    const env = { A: 'original' };
    const defaults = { B: 'new' };
    applyDefaults(env, defaults);
    expect(env).not.toHaveProperty('B');
  });

  it('returns empty report when defaults is empty', () => {
    const env = { X: '1' };
    const { result, report } = applyDefaults(env, {});
    expect(result).toEqual({ X: '1' });
    expect(report.applied).toEqual({});
    expect(report.skipped).toEqual([]);
  });

  it('applies all defaults when env is empty', () => {
    const defaults = { A: '1', B: '2' };
    const { result, report } = applyDefaults({}, defaults);
    expect(result).toEqual({ A: '1', B: '2' });
    expect(Object.keys(report.applied)).toHaveLength(2);
    expect(report.skipped).toHaveLength(0);
  });
});

describe('formatDefaultsReport', () => {
  it('includes applied keys in output', () => {
    const report = { applied: { FOO: 'bar' }, skipped: [] };
    const output = formatDefaultsReport(report);
    expect(output).toContain('+ FOO=bar');
  });

  it('includes skipped keys in output', () => {
    const report = { applied: {}, skipped: ['EXISTING'] };
    const output = formatDefaultsReport(report);
    expect(output).toContain('- EXISTING');
  });

  it('shows no defaults applied message when nothing applied', () => {
    const report = { applied: {}, skipped: ['X'] };
    const output = formatDefaultsReport(report);
    expect(output).toContain('No defaults applied.');
  });
});
