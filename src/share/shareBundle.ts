import { encrypt, decrypt } from '../crypto/encryption';
import { serialisePayload, deserialisePayload } from '../crypto/index';

export interface ShareBundle {
  version: number;
  createdAt: string;
  envName: string;
  payload: string; // base64-encoded encrypted blob
}

/**
 * Creates an encrypted share bundle from a set of env variables.
 * The bundle can be shared with team members who supply the shared passphrase.
 */
export async function createShareBundle(
  envVars: Record<string, string>,
  passphrase: string,
  envName: string
): Promise<ShareBundle> {
  const plaintext = JSON.stringify(envVars);
  const encrypted = await encrypt(plaintext, passphrase);
  const payload = serialisePayload(encrypted);

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    envName,
    payload,
  };
}

/**
 * Decrypts a share bundle using the supplied passphrase.
 * Returns the original env variable map.
 */
export async function openShareBundle(
  bundle: ShareBundle,
  passphrase: string
): Promise<Record<string, string>> {
  if (bundle.version !== 1) {
    throw new Error(`Unsupported share bundle version: ${bundle.version}`);
  }

  const encrypted = deserialisePayload(bundle.payload);
  const plaintext = await decrypt(encrypted, passphrase);
  const envVars = JSON.parse(plaintext) as Record<string, string>;

  return envVars;
}

/**
 * Serialises a ShareBundle to a JSON string suitable for file storage or
 * transmission (e.g. copy-paste, email, secret manager).
 */
export function serialiseBundle(bundle: ShareBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Parses a JSON string back into a ShareBundle, with basic validation.
 */
export function deserialiseBundle(raw: string): ShareBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid share bundle: not valid JSON');
  }

  const b = parsed as ShareBundle;
  if (!b.version || !b.payload || !b.envName || !b.createdAt) {
    throw new Error('Invalid share bundle: missing required fields');
  }

  return b;
}
