import { diffEnv, formatDiff } from './diff';

describe('diffEnv', () => {
  it('detects added keys', () => {
    const from = 'FOO=bar';
    const to = 'FOO=bar\nBAZ=qux';
    const result = diffEnv(from, to);
    expect(result.added).toEqual({ BAZ: 'qux' });
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
    expect(result.unchanged).toEqual({ FOO: 'bar' });
  });

  it('detects removed keys', () => {
    const from = 'FOO=bar\nBAZ=qux';
    const to = 'FOO=bar';
    const result = diffEnv(from, to);
    expect(result.removed).toEqual({ BAZ: 'qux' });
    expect(result.added).toEqual({});
  });

  it('detects changed values', () => {
    const from = 'FOO=bar';
    const to = 'FOO=baz';
    const result = diffEnv(from, to);
    expect(result.changed).toEqual({ FOO: { from: 'bar', to: 'baz' } });
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
    expect(result.unchanged).toEqual({});
  });

  it('detects unchanged keys', () => {
    const from = 'FOO=bar\nBAZ=qux';
    const to = 'FOO=bar\nBAZ=qux';
    const result = diffEnv(from, to);
    expect(result.unchanged).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
  });

  it('handles empty inputs', () => {
    const result = diffEnv('', '');
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
    expect(result.unchanged).toEqual({});
  });

  it('handles values containing = signs', () => {
    const from = 'URL=http://example.com';
    const to = 'URL=http://example.com?foo=bar';
    const result = diffEnv(from, to);
    expect(result.changed).toEqual({ URL: { from: 'http://example.com', to: 'http://example.com?foo=bar' } });
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
    expect(result.unchanged).toEqual({});
  });
});

describe('formatDiff', () => {
  it('returns no differences message when diff is empty', () => {
    const diff = diffEnv('FOO=bar', 'FOO=bar');
    expect(formatDiff(diff)).toBe('(no differences)');
  });

  it('formats added lines with +', () => {
    const diff = diffEnv('', 'NEW=value');
    expect(formatDiff(diff)).toContain('+ NEW=value');
  });

  it('formats removed lines with -', () => {
    const diff = diffEnv('OLD=value', '');
    expect(formatDiff(diff)).toContain('- OLD=value');
  });

  it('formats changed lines with ~', () => {
    const diff = diffEnv('KEY=old', 'KEY=new');
    expect(formatDiff(diff)).toContain('~ KEY: old → new');
  });
});
