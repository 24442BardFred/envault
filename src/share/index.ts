import { encrypt, decrypt, deriveKey } from '../crypto/encryption';
import { serialisePayload, deserialisePayload } from '../crypto/index';
import { serialiseBundle, deserialiseBundle } from './shareBundle';
import type { EnvMap } from '../env/parser';

export interface ShareOptions {
  passphrase: string;
  salt?: Uint8Array;
}

export interface ShareResult {
  bundle: string;
  salt: string;
}

/**
 * Encrypt an env map into a shareable base64 bundle string.
 */
export async function createShareBundle(
  envMap: EnvMap,
  options: ShareOptions
): Promise<ShareResult> {
  const salt =
    options.salt ??
    crypto.getRandomValues(new Uint8Array(16));

  const key = await deriveKey(options.passphrase, salt);
  const plaintext = serialiseBundle(envMap);
  const payload = await encrypt(key, plaintext);
  const bundle = serialisePayload(payload);

  return {
    bundle,
    salt: Buffer.from(salt).toString('base64'),
  };
}

/**
 * Decrypt a shareable bundle string back into an env map.
 */
export async function openShareBundle(
  bundle: string,
  passphrase: string,
  saltBase64: string
): Promise<EnvMap> {
  const salt = Buffer.from(saltBase64, 'base64');
  const key = await deriveKey(passphrase, salt);
  const payload = deserialisePayload(bundle);
  const plaintext = await decrypt(key, payload);
  return deserialiseBundle(plaintext);
}
