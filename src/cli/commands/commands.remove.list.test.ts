import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';

vi.mock('fs');
vi.mock('../../vault/vault');
vi.mock('../../vault/index');
vi.mock('readline');

import { loadVault, saveVault } from '../../vault/vault';
import { defaultVaultPath } from '../../vault/index';
import { removeCommand } from './remove';
import { listCommand } from './list';

const mockVaultPath = '/mock/.envault';
const mockVault = { DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'secret' };

beforeEach(() => {
  vi.mocked(defaultVaultPath).mockReturnValue(mockVaultPath);
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(loadVault).mockResolvedValue({ ...mockVault });
  vi.mocked(saveVault).mockResolvedValue(undefined);

  const rl = { question: vi.fn(), close: vi.fn() };
  rl.question.mockImplementation((_q: string, cb: (a: string) => void) => cb('testpassword'));
  const readline = require('readline');
  vi.mocked(readline.createInterface).mockReturnValue(rl);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('removeCommand', () => {
  it('removes an existing key from the vault', async () => {
    await removeCommand('DB_PORT');
    const saved = vi.mocked(saveVault).mock.calls[0][2] as Record<string, string>;
    expect(saved).not.toHaveProperty('DB_PORT');
    expect(saved).toHaveProperty('DB_HOST');
  });

  it('preserves other keys when removing one', async () => {
    await removeCommand('API_KEY');
    const saved = vi.mocked(saveVault).mock.calls[0][2] as Record<string, string>;
    expect(saved).toHaveProperty('DB_HOST', 'localhost');
    expect(saved).toHaveProperty('DB_PORT', '5432');
    expect(saved).not.toHaveProperty('API_KEY');
  });

  it('exits if vault does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(removeCommand('KEY')).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('exits if key is not found in vault', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(removeCommand('NONEXISTENT')).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe('listCommand', () => {
  it('lists keys without values by default', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await listCommand(false);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('DB_HOST');
    expect(output).not.toContain('localhost');
  });

  it('lists keys with values when showValues is true', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await listCommand(true);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('DB_HOST=localhost');
  });

  it('lists all keys from the vault', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await listCommand(false);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('DB_HOST');
    expect(output).toContain('DB_PORT');
    expect(output).toContain('API_KEY');
  });
});
