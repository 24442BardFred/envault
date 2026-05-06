import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rotateKey, validatePassword } from './keyRotation';
import * as vaultModule from '../vault/vault';
import * as auditModule from '../audit/index';
import * as encryptionModule from '../crypto/encryption';

const mockVault = {
  salt: 'testsalt',
  entries: {
    DB_HOST: 'encrypted_localhost',
    API_KEY: 'encrypted_abc123',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.spyOn(vaultModule, 'loadVault').mockResolvedValue(mockVault as any);
  vi.spyOn(vaultModule, 'saveVault').mockResolvedValue(undefined);
  vi.spyOn(auditModule, 'logAction').mockResolvedValue(undefined);
  vi.spyOn(encryptionModule, 'deriveKey').mockResolvedValue('mock-key' as any);
  vi.spyOn(encryptionModule, 'decrypt').mockResolvedValue('plaintext-value');
  vi.spyOn(encryptionModule, 'encrypt').mockResolvedValue('new-encrypted-value');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rotateKey', () => {
  it('should re-encrypt all entries and return rotation result', async () => {
    const result = await rotateKey('/mock/path/.envault', 'oldpass', 'newpass');

    expect(result.entriesRotated).toBe(2);
    expect(typeof result.rotatedAt).toBe('string');
    expect(vaultModule.saveVault).toHaveBeenCalledOnce();
  });

  it('should call logAction after successful rotation', async () => {
    await rotateKey('/mock/path/.envault', 'oldpass', 'newpass');
    expect(auditModule.logAction).toHaveBeenCalledWith(
      'rotate-key',
      expect.stringContaining('/mock/path/.envault')
    );
  });

  it('should derive keys for both old and new passwords', async () => {
    await rotateKey('/mock/path/.envault', 'oldpass', 'newpass');
    expect(encryptionModule.deriveKey).toHaveBeenCalledWith('newpass', 'testsalt');
    expect(encryptionModule.deriveKey).toHaveBeenCalledWith('oldpass', 'testsalt');
  });
});

describe('validatePassword', () => {
  it('should return true when password is correct', async () => {
    const result = await validatePassword('/mock/path/.envault', 'correctpass');
    expect(result).toBe(true);
  });

  it('should return false when loadVault throws', async () => {
    vi.spyOn(vaultModule, 'loadVault').mockRejectedValue(new Error('Bad password'));
    const result = await validatePassword('/mock/path/.envault', 'wrongpass');
    expect(result).toBe(false);
  });
});
