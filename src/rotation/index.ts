export { rotateKey, validatePassword } from './keyRotation';
export type { RotationResult } from './keyRotation';

/**
 * Key rotation module for envault.
 *
 * Provides utilities to safely re-encrypt vault contents
 * under a new master password without data loss.
 *
 * Usage:
 *   import { rotateKey, validatePassword } from './rotation';
 *
 *   const result = await rotateKey(vaultPath, oldPass, newPass);
 *   console.log(`Rotated ${result.entriesRotated} entries`);
 */
