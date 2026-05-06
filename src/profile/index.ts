export {
  createProfile,
  switchProfile,
  deleteProfile,
  getActiveProfile,
  listProfiles,
  loadProfileStore,
  saveProfileStore,
} from './profile';

export type { EnvaultProfile, ProfileStore } from './profile';

import { getActiveProfile } from './profile';
import { defaultVaultPath } from '../vault/index';

/**
 * Returns the vault path for the currently active profile,
 * falling back to the default vault path if no profile is active.
 */
export function resolveVaultPath(): string {
  const profile = getActiveProfile();
  return profile ? profile.vaultPath : defaultVaultPath;
}
