import { deriveKey, encrypt, decrypt } from '../crypto/encryption';
import { serialisePayload, deserialisePayload } from '../crypto/index';
import { loadVault, saveVault } from '../vault/vault';
import { logAction } from '../audit/index';

export interface RotationResult {
  rotatedAt: string;
  entriesRotated: number;
}

/**
 * Re-encrypts all vault entries with a new master password.
 * The old password is used to decrypt, the new password to re-encrypt.
 *
 * @throws {Error} If the old password is incorrect or decryption fails for any entry.
 */
export async function rotateKey(
  vaultPath: string,
  oldPassword: string,
  newPassword: string
): Promise<RotationResult> {
  const vault = await loadVault(vaultPath, oldPassword);

  const entries = Object.entries(vault.entries);
  const reEncrypted: Record<string, string> = {};

  const newKey = await deriveKey(newPassword, vault.salt);
  // Derive the old key once outside the loop to avoid redundant derivations
  const oldKey = await deriveKey(oldPassword, vault.salt);

  for (const [key, encryptedValue] of entries) {
    try {
      const plaintext = await decrypt(encryptedValue, oldKey);
      const newEncrypted = await encrypt(plaintext, newKey);
      reEncrypted[key] = newEncrypted;
    } catch (err) {
      throw new Error(
        `Failed to re-encrypt entry "${key}" during key rotation: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  const updatedVault = {
    ...vault,
    entries: reEncrypted,
    updatedAt: new Date().toISOString(),
  };

  await saveVault(vaultPath, updatedVault, newPassword);

  await logAction('rotate-key', `Rotated master key for vault at ${vaultPath}`);

  return {
    rotatedAt: updatedVault.updatedAt,
    entriesRotated: entries.length,
  };
}

/**
 * Validates that the given password can decrypt the vault.
 */
export async function validatePassword(
  vaultPath: string,
  password: string
): Promise<boolean> {
  try {
    await loadVault(vaultPath, password);
    return true;
  } catch {
    return false;
  }
}
