import { describe, it, expect } from 'vitest';
import { createShareBundle, openShareBundle } from './index';
import type { EnvMap } from '../env/parser';

const sampleEnv: EnvMap = new Map([
  ['API_KEY', 'super-secret-123'],
  ['DATABASE_URL', 'postgres://localhost:5432/mydb'],
  ['NODE_ENV', 'production'],
]);

const passphrase = 'correct-horse-battery-staple';

describe('createShareBundle', () => {
  it('returns a non-empty bundle string and a base64 salt', async () => {
    const result = await createShareBundle(sampleEnv, { passphrase });
    expect(typeof result.bundle).toBe('string');
    expect(result.bundle.length).toBeGreaterThan(0);
    expect(typeof result.salt).toBe('string');
    expect(Buffer.from(result.salt, 'base64').length).toBe(16);
  });

  it('produces different bundles for the same input (random IV)', async () => {
    const r1 = await createShareBundle(sampleEnv, { passphrase });
    const r2 = await createShareBundle(sampleEnv, { passphrase });
    expect(r1.bundle).not.toBe(r2.bundle);
  });
});

describe('openShareBundle', () => {
  it('round-trips an env map through share bundle', async () => {
    const { bundle, salt } = await createShareBundle(sampleEnv, { passphrase });
    const recovered = await openShareBundle(bundle, passphrase, salt);

    expect(recovered.size).toBe(sampleEnv.size);
    for (const [key, value] of sampleEnv) {
      expect(recovered.get(key)).toBe(value);
    }
  });

  it('throws when decrypting with the wrong passphrase', async () => {
    const { bundle, salt } = await createShareBundle(sampleEnv, { passphrase });
    await expect(
      openShareBundle(bundle, 'wrong-passphrase', salt)
    ).rejects.toThrow();
  });

  it('throws when decrypting with the wrong salt', async () => {
    const { bundle } = await createShareBundle(sampleEnv, { passphrase });
    const wrongSalt = Buffer.alloc(16, 0xff).toString('base64');
    await expect(
      openShareBundle(bundle, passphrase, wrongSalt)
    ).rejects.toThrow();
  });
});
