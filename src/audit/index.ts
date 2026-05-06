import * as path from 'path';
import {
  AuditAction,
  AuditEntry,
  appendAuditEntry,
  createAuditEntry,
  readAuditLog,
  clearAuditLog,
} from './auditLog';

export { AuditAction, AuditEntry };

export const defaultAuditLogPath = path.join(
  process.env.HOME || process.cwd(),
  '.envault',
  'audit.log'
);

export function logAction(
  action: AuditAction,
  key?: string,
  detail?: string,
  logPath: string = defaultAuditLogPath
): void {
  const entry = createAuditEntry(action, key, detail);
  appendAuditEntry(logPath, entry);
}

export function getAuditLog(
  logPath: string = defaultAuditLogPath
): AuditEntry[] {
  return readAuditLog(logPath);
}

export function clearLog(
  logPath: string = defaultAuditLogPath
): void {
  clearAuditLog(logPath);
}
