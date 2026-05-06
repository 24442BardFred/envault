export {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigPath,
  DEFAULT_CONFIG,
} from './config';
export type { EnvaultConfig } from './config';

import { loadConfig, saveConfig } from './config';
import type { EnvaultConfig } from './config';

/**
 * Get a single config value by key.
 */
export function getConfigValue<K extends keyof EnvaultConfig>(
  key: K
): EnvaultConfig[K] {
  const config = loadConfig();
  return config[key];
}

/**
 * Set a single config value by key.
 */
export function setConfigValue<K extends keyof EnvaultConfig>(
  key: K,
  value: EnvaultConfig[K]
): void {
  saveConfig({ [key]: value } as Partial<EnvaultConfig>);
}
