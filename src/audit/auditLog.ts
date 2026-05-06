import * as fs from 'fs';
import * as path from 'path';

export type AuditAction =
  | 'init'
  | 'set'
  | 'get'
  | 'remove'
  | 'list'
  | 'share'
  | 'import';

export interface AuditEntry {
  timestamp: string;
  action: AuditAction;
  key?: string;
  detail?: string;
}

export function createAuditEntry(
  action: AuditAction,
  key?: string,
  detail?: string
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    action,
    key,
    detail,
  };
}

export function appendAuditEntry(
  logPath: string,
  entry: AuditEntry
): void {
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(logPath, line, 'utf-8');
}

export function readAuditLog(logPath: string): AuditEntry[] {
  if (!fs.existsSync(logPath)) {
    return [];
  }
  const raw = fs.readFileSync(logPath, 'utf-8');
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as AuditEntry);
}

export function clearAuditLog(logPath: string): void {
  if (fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '', 'utf-8');
  }
}
