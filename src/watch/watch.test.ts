import { detectChangedKeys } from './watch';

describe('detectChangedKeys', () => {
  it('returns empty array when envs are identical', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    expect(detectChangedKeys(env, { ...env })).toEqual([]);
  });

  it('detects a modified value', () => {
    const previous = { FOO: 'old', BAR: 'same' };
    const current = { FOO: 'new', BAR: 'same' };
    const changed = detectChangedKeys(previous, current);
    expect(changed).toContain('FOO');
    expect(changed).not.toContain('BAR');
  });

  it('detects a newly added key', () => {
    const previous = { FOO: 'bar' };
    const current = { FOO: 'bar', NEW_KEY: 'value' };
    const changed = detectChangedKeys(previous, current);
    expect(changed).toContain('NEW_KEY');
    expect(changed).not.toContain('FOO');
  });

  it('detects a removed key', () => {
    const previous = { FOO: 'bar', OLD_KEY: 'value' };
    const current = { FOO: 'bar' };
    const changed = detectChangedKeys(previous, current);
    expect(changed).toContain('OLD_KEY');
    expect(changed).not.toContain('FOO');
  });

  it('detects multiple changes at once', () => {
    const previous = { A: '1', B: '2', C: '3' };
    const current = { A: '1', B: 'changed', D: 'new' };
    const changed = detectChangedKeys(previous, current);
    expect(changed).toContain('B');
    expect(changed).toContain('C');
    expect(changed).toContain('D');
    expect(changed).not.toContain('A');
  });

  it('returns empty array for two empty objects', () => {
    expect(detectChangedKeys({}, {})).toEqual([]);
  });
});
