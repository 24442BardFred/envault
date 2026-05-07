import {
  parseTemplate,
  serialiseTemplate,
  generateTemplate,
  validateAgainstTemplate,
} from './template';

describe('parseTemplate', () => {
  it('parses keys with default values as optional', () => {
    const content = 'API_URL=https://example.com';
    const tpl = parseTemplate(content);
    expect(tpl.variables).toHaveLength(1);
    expect(tpl.variables[0].key).toBe('API_URL');
    expect(tpl.variables[0].required).toBe(false);
    expect(tpl.variables[0].defaultValue).toBe('https://example.com');
  });

  it('parses keys without values as required', () => {
    const content = 'SECRET_KEY=';
    const tpl = parseTemplate(content);
    expect(tpl.variables[0].required).toBe(true);
    expect(tpl.variables[0].defaultValue).toBeUndefined();
  });

  it('captures comment as description', () => {
    const content = '# The database URL\nDB_URL=';
    const tpl = parseTemplate(content);
    expect(tpl.variables[0].description).toBe('The database URL');
  });

  it('ignores blank lines between entries', () => {
    const content = 'A=1\n\nB=2';
    const tpl = parseTemplate(content);
    expect(tpl.variables).toHaveLength(2);
  });
});

describe('serialiseTemplate', () => {
  it('round-trips a template', () => {
    const content = '# My key\nMY_KEY=';
    const tpl = parseTemplate(content);
    const out = serialiseTemplate(tpl);
    expect(out).toContain('# My key');
    expect(out).toContain('MY_KEY=');
  });

  it('omits comment line when no description', () => {
    const tpl = generateTemplate({ FOO: 'bar' });
    const out = serialiseTemplate(tpl);
    expect(out).not.toContain('#');
  });
});

describe('generateTemplate', () => {
  it('marks all keys as required with no default values', () => {
    const tpl = generateTemplate({ A: '1', B: '2' });
    expect(tpl.variables).toHaveLength(2);
    tpl.variables.forEach((v) => {
      expect(v.required).toBe(true);
      expect(v.defaultValue).toBeUndefined();
    });
  });
});

describe('validateAgainstTemplate', () => {
  it('returns missing required keys', () => {
    const tpl = generateTemplate({ A: '', B: '' });
    const missing = validateAgainstTemplate({ A: 'hello' }, tpl);
    expect(missing).toEqual(['B']);
  });

  it('returns empty array when all required keys present', () => {
    const tpl = generateTemplate({ A: '' });
    const missing = validateAgainstTemplate({ A: 'val' }, tpl);
    expect(missing).toHaveLength(0);
  });
});
