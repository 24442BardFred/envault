import { parseEnv, serialiseEnv, EnvRecord } from './parser';

describe('parseEnv', () => {
  it('parses simple key=value pairs', () => {
    const input = 'FOO=bar\nBAZ=qux';
    expect(parseEnv(input)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comment lines', () => {
    const input = '# This is a comment\nFOO=bar';
    expect(parseEnv(input)).toEqual({ FOO: 'bar' });
  });

  it('ignores blank lines', () => {
    const input = '\nFOO=bar\n\nBAZ=qux\n';
    expect(parseEnv(input)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('strips double-quoted values', () => {
    const input = 'FOO="hello world"';
    expect(parseEnv(input)).toEqual({ FOO: 'hello world' });
  });

  it('strips single-quoted values', () => {
    const input = "FOO='hello world'";
    expect(parseEnv(input)).toEqual({ FOO: 'hello world' });
  });

  it('handles values containing equals signs', () => {
    const input = 'DATABASE_URL=postgres://user:pass@host/db?sslmode=require';
    expect(parseEnv(input)).toEqual({
      DATABASE_URL: 'postgres://user:pass@host/db?sslmode=require',
    });
  });

  it('skips lines without an equals sign', () => {
    const input = 'INVALID_LINE\nFOO=bar';
    expect(parseEnv(input)).toEqual({ FOO: 'bar' });
  });

  it('returns empty object for empty string', () => {
    expect(parseEnv('')).toEqual({});
  });
});

describe('serialiseEnv', () => {
  it('serialises a record to env format', () => {
    const record: EnvRecord = { FOO: 'bar', BAZ: 'qux' };
    const output = serialiseEnv(record);
    expect(output).toContain('FOO=bar');
    expect(output).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    const record: EnvRecord = { FOO: 'hello world' };
    expect(serialiseEnv(record)).toBe('FOO="hello world"');
  });

  it('round-trips through parse and serialise', () => {
    const original: EnvRecord = { API_KEY: 'abc123', HOST: 'localhost' };
    const serialised = serialiseEnv(original);
    const parsed = parseEnv(serialised);
    expect(parsed).toEqual(original);
  });
});
