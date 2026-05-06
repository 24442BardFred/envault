import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createAuditEntry,
  appendAuditEntry,
  readAuditLog,
  clearAuditLog,
} from './auditLog';

let tmpDir: string;
let logPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-audit-'));
  logPath = path.join(tmpDir, 'audit.log');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('createAuditEntry', () => {
  it('creates an entry with the correct action', () => {
    const entry = createAuditEntry('set', 'API_KEY', 'added');
    expect(entry.action).toBe('set');
    expect(entry.key).toBe('API_KEY');
    expect(entry.detail).toBe('added');
    expect(entry.timestamp).toBeDefined();
  });

  it('creates an entry without optional fields', () => {
    const entry = createAuditEntry('init');
    expect(entry.action).toBe('init');
    expect(entry.key).toBeUndefined();
    expect(entry.detail).toBeUndefined();
  });
});

describe('appendAuditEntry and readAuditLog', () => {
  it('appends and reads back entries', () => {
    const e1 = createAuditEntry('set', 'FOO');
    const e2 = createAuditEntry('remove', 'BAR');
    appendAuditEntry(logPath, e1);
    appendAuditEntry(logPath, e2);
    const entries = readAuditLog(logPath);
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('set');
    expect(entries[1].action).toBe('remove');
  });

  it('returns empty array when log does not exist', () => {
    const entries = readAuditLog(path.join(tmpDir, 'nonexistent.log'));
    expect(entries).toEqual([]);
  });
});

describe('clearAuditLog', () => {
  it('clears the log file', () => {
    appendAuditEntry(logPath, createAuditEntry('get', 'KEY'));
    clearAuditLog(logPath);
    const entries = readAuditLog(logPath);
    expect(entries).toHaveLength(0);
  });

  it('does not throw if file does not exist', () => {
    expect(() =>
      clearAuditLog(path.join(tmpDir, 'missing.log'))
    ).not.toThrow();
  });
});
