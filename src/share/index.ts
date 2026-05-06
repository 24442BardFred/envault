import { serialiseBundle, deserialiseBundle } from './shareBundle';
import { encrypt, decrypt, deriveKey } from '../crypto/encryption';
import { serialisePayload, deserialisePayload } from '../crypto/index';

export type VaultData = Record<string, string>;

export async function createShareBundle(
  vault: VaultData,
  sharePassword: string,
  keys?: string[]
): Promise<string> {
  const subset: VaultData = {};

  const selectedKeys = keys ?? Object.keys(vault);
  for (const key of selectedKeys) {
    if (key in vault) {
      subset[key] = vault[key];
    }
  }

  const plaintext = JSON.stringify(subset);
  const { key, salt } = await deriveKey(sharePassword);
  const { ciphertext, iv } = await encrypt(plaintext, key);
  const payload = serialisePayload({ ciphertext, iv, salt });
  return serialiseBundle(payload);
}

export async function importShareBundle(
  bundle: string,
  sharePassword: string,
  existingVault: VaultData,
  overwrite = false
): Promise<VaultData> {
  const payload = deserialiseBundle(bundle);
  const { ciphertext, iv, salt } = deserialisePayload(payload);
  const { key } = await deriveKey(sharePassword, salt);
  const plaintext = await decrypt(ciphertext, key, iv);
  const imported: VaultData = JSON.parse(plaintext);

  const merged: VaultData = { ...existingVault };
  for (const [k, v] of Object.entries(imported)) {
    if (overwrite || !(k in merged)) {
      merged[k] = v;
    }
  }
  return merged;
}
