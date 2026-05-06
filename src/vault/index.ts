export { Vault } from './vault';
export type { VaultEntry, VaultData } from './vault';

import * as path from 'path';
import * as os from 'os';

/**
 * Returns the default vault file path for the current user.
 * Can be overridden via the ENVAULT_PATH environment variable.
 */
export function defaultVaultPath(): string {
  const custom = process.env.ENVAULT_PATH;
  if (custom) return path.resolve(custom);
  return path.join(os.homedir(), '.envault', 'default.vault');
}

/**
 * Creates a Vault instance using the default path and the provided password.
 */
export async function openDefaultVault(password: string) {
  const { Vault } = await import('./vault');
  return new Vault(defaultVaultPath(), password);
}
