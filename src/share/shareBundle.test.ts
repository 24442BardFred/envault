import { describe, it, expect } from 'vitest';
import {
  createShareBundle,
  openShareBundle,
  serialiseBundle,
  deserialiseBundle,
} from './shareBundle';

const SAMPLE_ENV: Record<string, string> = {
  DATABASE_URL: 'postgres://user:pass@localhost/db',
  API_KEY: 'supersecret-api-key',
  NODE_ENV: 'production',
};

const PASSPHRASE = 'correct-horse-battery-staple';
const ENV_NAME = 'production';

describe('createShareBundle', () => {
  it('creates a bundle with expected shape', async () => {
    const bundle = await createShareBundle(SAMPLE_ENV, PASSPHRASE, ENV_NAME);

    expect(bundle.version).toBe(1);
    expect(bundle.envName).toBe(ENV_NAME);
    expect(typeof bundle.payload).toBe('string');
    expect(bundle.payload.length).toBeGreaterThan(0);
    expect(typeof bundle.createdAt).toBe('string');
  });

  it('produces different payloads for the same input (random IV)', async () => {
    const bundle1 = await createShareBundle(SAMPLE_ENV, PASSPHRASE, ENV_NAME);
    const bundle2 = await createShareBundle(SAMPLE_ENV, PASSPHRASE, ENV_NAME);
    expect(bundle1.payload).not.toBe(bundle2.payload);
  });
});

describe('openShareBundle', () => {
  it('decrypts a bundle back to the original env vars', async () => {
    const bundle = await createShareBundle(SAMPLE_ENV, PASSPHRASE, ENV_NAME);
    const result = await openShareBundle(bundle, PASSPHRASE);
    expect(result).toEqual(SAMPLE_ENV);
  });

  it('throws with the wrong passphrase', async () => {
    const bundle = await createShareBundle(SAMPLE_ENV, PASSPHRASE, ENV_NAME);
    await expect(openShareBundle(bundle, 'wrong-passphrase')).rejects.toThrow();
  });

  it('throws for unsupported bundle versions', async () => {
    const bundle = await createShareBundle(SAMPLE_ENV, PASSPHRASE, ENV_NAME);
    const badBundle = { ...bundle, version: 99 };
    await expect(openShareBundle(badBundle, PASSPHRASE)).rejects.toThrow(
      'Unsupported share bundle version: 99'
    );
  });
});

describe('serialiseBundle / deserialiseBundle', () => {
  it('round-trips through JSON', async () => {
    const bundle = await createShareBundle(SAMPLE_ENV, PASSPHRASE, ENV_NAME);
    const json = serialiseBundle(bundle);
    const restored = deserialiseBundle(json);
    expect(restored).toEqual(bundle);
  });

  it('throws on invalid JSON', () => {
    expect(() => deserialiseBundle('not json')).toThrow(
      'Invalid share bundle: not valid JSON'
    );
  });

  it('throws when required fields are missing', () => {
    const incomplete = JSON.stringify({ version: 1 });
    expect(() => deserialiseBundle(incomplete)).toThrow(
      'Invalid share bundle: missing required fields'
    );
  });
});
