export { encrypt, decrypt, deriveKey } from './encryption';
export type { EncryptedPayload } from './encryption';

/**
 * Serialises an EncryptedPayload to a compact JSON string
 * suitable for writing to disk or transmitting over the network.
 */
export function serialisePayload(payload: import('./encryption').EncryptedPayload): string {
  return JSON.stringify(payload);
}

/**
 * Deserialises a JSON string back into an EncryptedPayload.
 * Throws if the string is malformed or missing required fields.
 */
export function deserialisePayload(raw: string): import('./encryption').EncryptedPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid encrypted payload: not valid JSON');
  }

  const obj = parsed as Record<string, unknown>;
  const required = ['iv', 'authTag', 'salt', 'ciphertext'];
  for (const field of required) {
    if (typeof obj[field] !== 'string') {
      throw new Error(`Invalid encrypted payload: missing or invalid field "${field}"`);
    }
  }

  return obj as import('./encryption').EncryptedPayload;
}
