import { describe, it, expect } from 'vitest';
import {
  isSensitiveKey,
  redactValue,
  redactEnv,
  formatRedactReport,
} from './redact';

describe('isSensitiveKey', () => {
  it('detects PASSWORD key', () => {
    expect(isSensitiveKey('DB_PASSWORD')).toBe(true);
  });

  it('detects SECRET key', () => {
    expect(isSensitiveKey('APP_SECRET')).toBe(true);
  });

  it('detects TOKEN key', () => {
    expect(isSensitiveKey('ACCESS_TOKEN')).toBe(true);
  });

  it('detects API_KEY', () => {
    expect(isSensitiveKey('STRIPE_API_KEY')).toBe(true);
  });

  it('does not flag safe keys', () => {
    expect(isSensitiveKey('APP_NAME')).toBe(false);
    expect(isSensitiveKey('PORT')).toBe(false);
    expect(isSensitiveKey('NODE_ENV')).toBe(false);
  });

  it('respects custom patterns', () => {
    expect(isSensitiveKey('INTERNAL_CODE', [/code/i])).toBe(true);
    expect(isSensitiveKey('DB_PASSWORD', [/code/i])).toBe(false);
  });
});

describe('redactValue', () => {
  it('fully masks by default', () => {
    expect(redactValue('supersecret')).toBe('********');
  });

  it('uses custom mask', () => {
    expect(redactValue('supersecret', '***')).toBe('***');
  });

  it('reveals tail characters when requested', () => {
    expect(redactValue('supersecret', '********', 4)).toBe('********cret');
  });

  it('fully masks when value is shorter than revealTail', () => {
    expect(redactValue('abc', '********', 4)).toBe('********');
  });
});

describe('redactEnv', () => {
  const env = {
    APP_NAME: 'myapp',
    DB_PASSWORD: 'hunter2',
    ACCESS_TOKEN: 'tok_abc123',
    PORT: '3000',
  };

  it('redacts sensitive keys and preserves safe keys', () => {
    const result = redactEnv(env);
    expect(result.APP_NAME).toBe('myapp');
    expect(result.PORT).toBe('3000');
    expect(result.DB_PASSWORD).toBe('********');
    expect(result.ACCESS_TOKEN).toBe('********');
  });

  it('supports revealTail option', () => {
    const result = redactEnv(env, { revealTail: 3 });
    expect(result.DB_PASSWORD).toBe('********er2');
  });

  it('supports custom mask', () => {
    const result = redactEnv(env, { mask: '[HIDDEN]' });
    expect(result.DB_PASSWORD).toBe('[HIDDEN]');
  });
});

describe('formatRedactReport', () => {
  it('lists redacted keys', () => {
    const original = { DB_PASSWORD: 'secret', APP_NAME: 'myapp' };
    const redacted = { DB_PASSWORD: '********', APP_NAME: 'myapp' };
    const report = formatRedactReport(original, redacted);
    expect(report).toContain('[REDACTED] DB_PASSWORD');
    expect(report).not.toContain('APP_NAME');
  });

  it('reports no sensitive keys when nothing redacted', () => {
    const env = { APP_NAME: 'myapp' };
    const report = formatRedactReport(env, env);
    expect(report).toContain('No sensitive keys found.');
  });
});
