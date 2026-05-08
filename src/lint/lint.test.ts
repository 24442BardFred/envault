import { lintEnv, formatLintResults, defaultRules, LintRule } from './lint';

describe('lintEnv', () => {
  it('returns no issues for a clean env', () => {
    const issues = lintEnv({ DATABASE_URL: 'postgres://localhost/db', PORT: '3000' });
    expect(issues).toHaveLength(0);
  });

  it('flags empty values', () => {
    const issues = lintEnv({ API_KEY: '' });
    expect(issues.some((i) => i.rule === 'no-empty-value')).toBe(true);
  });

  it('flags quoted values', () => {
    const issues = lintEnv({ SECRET: '"my-secret"' });
    expect(issues.some((i) => i.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('flags lowercase keys', () => {
    const issues = lintEnv({ myKey: 'value' });
    expect(issues.some((i) => i.rule === 'uppercase-key')).toBe(true);
  });

  it('flags keys with spaces as error', () => {
    const issues = lintEnv({ 'BAD KEY': 'value' });
    const issue = issues.find((i) => i.rule === 'no-spaces-in-key');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('error');
  });

  it('flags keys with special characters', () => {
    const issues = lintEnv({ 'BAD-KEY': 'value' });
    expect(issues.some((i) => i.rule === 'no-special-chars-in-key')).toBe(true);
  });

  it('supports custom rules', () => {
    const customRule: LintRule = {
      name: 'no-localhost',
      severity: 'warn',
      check: (_, value) =>
        value.includes('localhost') ? 'Avoid localhost in production configs.' : null,
    };
    const issues = lintEnv({ DB: 'localhost:5432' }, [customRule]);
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('no-localhost');
  });

  it('returns issues for multiple keys', () => {
    const issues = lintEnv({ api_key: '', PORT: '3000' }, defaultRules);
    expect(issues.length).toBeGreaterThan(1);
  });
});

describe('formatLintResults', () => {
  it('returns friendly message when no issues', () => {
    expect(formatLintResults([])).toBe('No lint issues found.');
  });

  it('formats issues with severity and rule', () => {
    const issues = lintEnv({ 'bad key': '' });
    const output = formatLintResults(issues);
    expect(output).toContain('[ERROR]');
    expect(output).toContain('[WARN]');
  });
});
