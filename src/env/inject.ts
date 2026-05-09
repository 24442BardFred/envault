import { readEnvFile } from './index';
import { resolveVaultPath } from '../profile/index';

export interface InjectOptions {
  profile?: string;
  overwrite?: boolean;
  prefix?: string;
}

/**
 * Injects env variables from the vault into process.env.
 * Returns the list of keys that were injected.
 */
export async function injectEnvIntoProcess(
  password: string,
  options: InjectOptions = {}
): Promise<string[]> {
  const vaultPath = resolveVaultPath(options.profile);
  const entries = await readEnvFile(vaultPath, password);

  const injected: string[] = [];

  for (const [key, value] of Object.entries(entries)) {
    const targetKey = options.prefix ? `${options.prefix}${key}` : key;

    if (!options.overwrite && targetKey in process.env) {
      continue;
    }

    process.env[targetKey] = value;
    injected.push(targetKey);
  }

  return injected;
}

/**
 * Ejects (removes) previously injected keys from process.env.
 */
export function ejectEnvFromProcess(keys: string[]): void {
  for (const key of keys) {
    delete process.env[key];
  }
}

/**
 * Runs a callback with env variables injected, then cleans up.
 */
export async function withInjectedEnv<T>(
  password: string,
  fn: () => Promise<T>,
  options: InjectOptions = {}
): Promise<T> {
  const injected = await injectEnvIntoProcess(password, options);
  try {
    return await fn();
  } finally {
    ejectEnvFromProcess(injected);
  }
}
