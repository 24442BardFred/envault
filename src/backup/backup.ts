import * as fs from 'fs';
import * as path from 'path';
import { defaultVaultPath } from '../vault/index';

export interface BackupMeta {
  timestamp: string;
  vaultPath: string;
  backupPath: string;
}

export function getBackupDir(): string {
  return path.join(path.dirname(defaultVaultPath), 'backups');
}

export function ensureBackupDir(): void {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createBackup(vaultPath: string = defaultVaultPath): BackupMeta {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found at: ${vaultPath}`);
  }

  ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `vault-${timestamp}.enc.bak`;
  const backupPath = path.join(getBackupDir(), backupFileName);

  fs.copyFileSync(vaultPath, backupPath);

  return { timestamp, vaultPath, backupPath };
}

export function listBackups(): BackupMeta[] {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.enc.bak'))
    .sort()
    .reverse()
    .map((f) => {
      const backupPath = path.join(dir, f);
      const timestamp = f.replace('vault-', '').replace('.enc.bak', '');
      return { timestamp, vaultPath: defaultVaultPath, backupPath };
    });
}

export function restoreBackup(backupPath: string, vaultPath: string = defaultVaultPath): void {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found at: ${backupPath}`);
  }
  fs.copyFileSync(backupPath, vaultPath);
}

export function deleteBackup(backupPath: string): void {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found at: ${backupPath}`);
  }
  fs.unlinkSync(backupPath);
}
