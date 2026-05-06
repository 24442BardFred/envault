import { Vault, VaultData } from './vault';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Vault', () => {
  let tmpDir: string;
  let vaultPath: string;
  let vault: Vault;
  const password = 'test-password-123';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    vault = new Vault(vaultPath, password);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty vault data when file does not exist', async () => {
    const data = await vault.load();
    expect(data.entries).toEqual({});
    expect(data.version).toBe(1);
  });

  it('sets and retrieves a value', async () => {
    await vault.set('API_KEY', 'secret-value');
    const value = await vault.get('API_KEY');
    expect(value).toBe('secret-value');
  });

  it('overwrites an existing key', async () => {
    await vault.set('DB_URL', 'postgres://old');
    await vault.set('DB_URL', 'postgres://new');
    const value = await vault.get('DB_URL');
    expect(value).toBe('postgres://new');
  });

  it('returns undefined for missing key', async () => {
    const value = await vault.get('NONEXISTENT');
    expect(value).toBeUndefined();
  });

  it('removes a key and returns true', async () => {
    await vault.set('TOKEN', 'abc123');
    const removed = await vault.remove('TOKEN');
    expect(removed).toBe(true);
    expect(await vault.get('TOKEN')).toBeUndefined();
  });

  it('returns false when removing a non-existent key', async () => {
    const removed = await vault.remove('GHOST');
    expect(removed).toBe(false);
  });

  it('lists all entries', async () => {
    await vault.set('KEY_A', 'val_a');
    await vault.set('KEY_B', 'val_b');
    const entries = await vault.list();
    expect(entries).toHaveLength(2);
    const keys = entries.map((e) => e.key);
    expect(keys).toContain('KEY_A');
    expect(keys).toContain('KEY_B');
  });

  it('persists data across vault instances', async () => {
    await vault.set('PERSIST_KEY', 'persist_value');
    const vault2 = new Vault(vaultPath, password);
    const value = await vault2.get('PERSIST_KEY');
    expect(value).toBe('persist_value');
  });

  it('fails to load with wrong password', async () => {
    await vault.set('SECRET', 'value');
    const wrongVault = new Vault(vaultPath, 'wrong-password');
    await expect(wrongVault.load()).rejects.toThrow();
  });
});
