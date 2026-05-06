import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getBackupDir,
} from './backup';
import * as backupModule from './backup';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-backup-test-'));
const fakeVaultPath = path.join(tmpDir, 'vault.enc');
const fakeBackupDir = path.join(tmpDir, 'backups');

beforeEach(() => {
  fs.writeFileSync(fakeVaultPath, 'encrypted-vault-content');
  jest.spyOn(backupModule, 'getBackupDir').mockReturnValue(fakeBackupDir);
});

afterEach(() => {
  jest.restoreAllMocks();
  if (fs.existsSync(fakeBackupDir)) {
    fs.readdirSync(fakeBackupDir).forEach((f) =>
      fs.unlinkSync(path.join(fakeBackupDir, f))
    );
    fs.rmdirSync(fakeBackupDir);
  }
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('createBackup creates a .enc.bak file', () => {
  const meta = createBackup(fakeVaultPath);
  expect(fs.existsSync(meta.backupPath)).toBe(true);
  expect(meta.backupPath).toMatch(/\.enc\.bak$/);
  expect(fs.readFileSync(meta.backupPath, 'utf-8')).toBe('encrypted-vault-content');
});

test('createBackup throws if vault does not exist', () => {
  expect(() => createBackup('/nonexistent/path/vault.enc')).toThrow('Vault not found');
});

test('listBackups returns sorted backups', () => {
  createBackup(fakeVaultPath);
  createBackup(fakeVaultPath);
  const backups = listBackups();
  expect(backups.length).toBe(2);
  expect(backups[0].backupPath).toMatch(/\.enc\.bak$/);
});

test('listBackups returns empty array when no backups exist', () => {
  const backups = listBackups();
  expect(backups).toEqual([]);
});

test('restoreBackup restores vault from backup', () => {
  const meta = createBackup(fakeVaultPath);
  const restorePath = path.join(tmpDir, 'restored.enc');
  restoreBackup(meta.backupPath, restorePath);
  expect(fs.readFileSync(restorePath, 'utf-8')).toBe('encrypted-vault-content');
});

test('restoreBackup throws if backup does not exist', () => {
  expect(() => restoreBackup('/bad/path.enc.bak')).toThrow('Backup not found');
});

test('deleteBackup removes the backup file', () => {
  const meta = createBackup(fakeVaultPath);
  deleteBackup(meta.backupPath);
  expect(fs.existsSync(meta.backupPath)).toBe(false);
});

test('deleteBackup throws if file does not exist', () => {
  expect(() => deleteBackup('/bad/path.enc.bak')).toThrow('Backup not found');
});
