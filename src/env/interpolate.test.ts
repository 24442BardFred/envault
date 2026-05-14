import { describe, it, expect } from 'vitest';
import { extractRefs, resolveValue, interpolateEnv } from './interpolate';

describe('extractRefs', () => {
  it('extracts ${VAR} references', () => {
    expect(extractRefs('hello ${WORLD}')).toEqual(['WORLD']);
  });

  it('extracts $VAR references', () => {
    expect(extractRefs('hello $WORLD')).toEqual(['WORLD']);
  });

  it('extracts multiple references', () => {
    expect(extractRefs('${A}/${B}')).toEqual(['A', 'B']);
  });

  it('returns empty array for plain strings', () => {
    expect(extractRefs('no refs here')).toEqual([]);
  });

  it('does not duplicate repeated references', () => {
    expect(extractRefs('${A} and ${A} again')).toEqual(['A']);
  });
});

describe('resolveValue', () => {
  it('replaces ${VAR} with env value', () => {
    expect(resolveValue('hello ${NAME}', { NAME: 'world' })).toBe('hello world');
  });

  it('replaces $VAR with env value', () => {
    expect(resolveValue('$HOST:3000', { HOST: 'localhost' })).toBe('localhost:3000');
  });

  it('leaves unresolvable references intact', () => {
    expect(resolveValue('${MISSING}', {})).toBe('${MISSING}');
  });
});

describe('interpolateEnv', () => {
  it('resolves simple references', () => {
    const result = interpolateEnv({ BASE: 'http://localhost', URL: '${BASE}/api' });
    expect(result.resolved['URL']).toBe('http://localhost/api');
    expect(result.unresolved).toHaveLength(0);
    expect(result.circular).toHaveLength(0);
  });

  it('chains multiple references', () => {
    const result = interpolateEnv({ A: 'foo', B: '${A}_bar', C: '${B}_baz' });
    expect(result.resolved['C']).toBe('foo_bar_baz');
  });

  it('reports unresolved keys', () => {
    const result = interpolateEnv({ URL: '${MISSING}/path' });
    expect(result.unresolved).toContain('URL');
  });

  it('detects circular references', () => {
    const result = interpolateEnv({ A: '${B}', B: '${A}' });
    expect(result.circular).toContain('A');
    expect(result.circular).toContain('B');
  });

  it('handles env without any references', () => {
    const result = interpolateEnv({ FOO: 'bar', BAZ: 'qux' });
    expect(result.resolved).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(result.unresolved).toHaveLength(0);
  });

  it('handles empty env object', () => {
    const result = interpolateEnv({});
    expect(result.resolved).toEqual({});
    expect(result.unresolved).toHaveLength(0);
    expect(result.circular).toHaveLength(0);
  });
});
