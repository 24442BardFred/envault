import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault, loadVault } from '../../vault/vault';
import { setCommand, unsetCommand } from './set';
import { getCommand } from './get';

const PASSWORD = 'test-password-123';

async function makeTempVault(): Promise<string> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cli-'));
  const vaultPath = path.join(dir, 'vault.enc');
  await createVault(vaultPath, PASSWORD);
  return vaultPath;
}

describe('setCommand', () => {
  it('stores a key-value pair in the vault', async () => {
    const vaultPath = await makeTempVault();
    await setCommand({ key: 'API_KEY', value: 'abc123', password: PASSWORD, vaultPath });
    const vault = await loadVault(vaultPath, PASSWORD);
    expect(vault.environments['default']['API_KEY']).toBe('abc123');
  });

  it('creates a new environment if it does not exist', async () => {
    const vaultPath = await makeTempVault();
    await setCommand({ key: 'DB_URL', value: 'postgres://localhost', password: PASSWORD, vaultPath, environment: 'staging' });
    const vault = await loadVault(vaultPath, PASSWORD);
    expect(vault.environments['staging']['DB_URL']).toBe('postgres://localhost');
  });
});

describe('unsetCommand', () => {
  it('removes a key from the vault', async () => {
    const vaultPath = await makeTempVault();
    await setCommand({ key: 'TO_REMOVE', value: 'bye', password: PASSWORD, vaultPath });
    await unsetCommand({ key: 'TO_REMOVE', password: PASSWORD, vaultPath });
    const vault = await loadVault(vaultPath, PASSWORD);
    expect(vault.environments['default']['TO_REMOVE']).toBeUndefined();
  });
});

describe('getCommand', () => {
  it('prints a single key value', async () => {
    const vaultPath = await makeTempVault();
    await setCommand({ key: 'MY_VAR', value: 'hello', password: PASSWORD, vaultPath });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await getCommand({ key: 'MY_VAR', password: PASSWORD, vaultPath });
    expect(spy).toHaveBeenCalledWith('hello');
    spy.mockRestore();
  });
});
