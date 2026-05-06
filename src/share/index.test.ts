import { createShareBundle, importShareBundle, VaultData } from './index';

const sampleVault: VaultData = {
  DATABASE_URL: 'postgres://localhost/mydb',
  API_KEY: 'supersecretkey',
  DEBUG: 'true',
};

const sharePassword = 'share-pass-123';

describe('createShareBundle', () => {
  it('should create a non-empty bundle string', async () => {
    const bundle = await createShareBundle(sampleVault, sharePassword);
    expect(typeof bundle).toBe('string');
    expect(bundle.length).toBeGreaterThan(0);
  });

  it('should only include specified keys', async () => {
    const bundle = await createShareBundle(sampleVault, sharePassword, ['API_KEY']);
    const imported = await importShareBundle(bundle, sharePassword, {}, false);
    expect(imported).toHaveProperty('API_KEY');
    expect(imported).not.toHaveProperty('DATABASE_URL');
  });
});

describe('importShareBundle', () => {
  it('should correctly round-trip vault data', async () => {
    const bundle = await createShareBundle(sampleVault, sharePassword);
    const result = await importShareBundle(bundle, sharePassword, {}, false);
    expect(result).toEqual(sampleVault);
  });

  it('should not overwrite existing keys when overwrite is false', async () => {
    const bundle = await createShareBundle(sampleVault, sharePassword);
    const existing: VaultData = { API_KEY: 'original-key' };
    const result = await importShareBundle(bundle, sharePassword, existing, false);
    expect(result.API_KEY).toBe('original-key');
  });

  it('should overwrite existing keys when overwrite is true', async () => {
    const bundle = await createShareBundle(sampleVault, sharePassword);
    const existing: VaultData = { API_KEY: 'original-key' };
    const result = await importShareBundle(bundle, sharePassword, existing, true);
    expect(result.API_KEY).toBe('supersecretkey');
  });

  it('should throw on wrong password', async () => {
    const bundle = await createShareBundle(sampleVault, sharePassword);
    await expect(importShareBundle(bundle, 'wrong-password', {}, false)).rejects.toThrow();
  });
});
