import { castValue, castEnv, formatCastReport, CastRule } from './cast';

describe('castValue', () => {
  it('casts to number', () => {
    expect(castValue('42', 'number')).toEqual({ casted: 42 });
    expect(castValue('3.14', 'number')).toEqual({ casted: 3.14 });
  });

  it('returns error for invalid number', () => {
    const result = castValue('abc', 'number');
    expect(result.error).toBeDefined();
    expect(result.casted).toBe('abc');
  });

  it('casts truthy boolean values', () => {
    for (const v of ['true', '1', 'yes', 'on']) {
      expect(castValue(v, 'boolean').casted).toBe(true);
    }
  });

  it('casts falsy boolean values', () => {
    for (const v of ['false', '0', 'no', 'off']) {
      expect(castValue(v, 'boolean').casted).toBe(false);
    }
  });

  it('returns error for invalid boolean', () => {
    const result = castValue('maybe', 'boolean');
    expect(result.error).toBeDefined();
  });

  it('casts JSON', () => {
    expect(castValue('{"a":1}', 'json').casted).toEqual({ a: 1 });
    expect(castValue('[1,2,3]', 'json').casted).toEqual([1, 2, 3]);
  });

  it('returns error for invalid JSON', () => {
    const result = castValue('{bad}', 'json');
    expect(result.error).toBeDefined();
  });

  it('returns string as-is', () => {
    expect(castValue('hello', 'string')).toEqual({ casted: 'hello' });
  });
});

describe('castEnv', () => {
  const env = { PORT: '3000', DEBUG: 'true', NAME: 'envault', CONFIG: '{"x":1}' };

  it('casts multiple keys according to rules', () => {
    const rules: CastRule[] = [
      { key: 'PORT', type: 'number' },
      { key: 'DEBUG', type: 'boolean' },
      { key: 'CONFIG', type: 'json' },
    ];
    const { casted, report } = castEnv(env, rules);
    expect(casted['PORT']).toBe(3000);
    expect(casted['DEBUG']).toBe(true);
    expect(casted['CONFIG']).toEqual({ x: 1 });
    expect(casted['NAME']).toBe('envault');
    expect(report.errors).toHaveLength(0);
  });

  it('skips keys not present in env', () => {
    const rules: CastRule[] = [{ key: 'MISSING', type: 'number' }];
    const { report } = castEnv(env, rules);
    expect(report.results).toHaveLength(0);
  });

  it('records errors without overwriting original value', () => {
    const rules: CastRule[] = [{ key: 'NAME', type: 'number' }];
    const { casted, report } = castEnv(env, rules);
    expect(report.errors).toHaveLength(1);
    expect(casted['NAME']).toBe('envault');
  });
});

describe('formatCastReport', () => {
  it('formats successes and errors', () => {
    const rules: CastRule[] = [
      { key: 'PORT', type: 'number' },
      { key: 'NAME', type: 'number' },
    ];
    const { report } = castEnv({ PORT: '8080', NAME: 'bad' }, rules);
    const output = formatCastReport(report);
    expect(output).toContain('✓ PORT');
    expect(output).toContain('✗ NAME');
  });
});
