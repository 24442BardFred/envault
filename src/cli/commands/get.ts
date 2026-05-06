import { loadVault } from '../../vault/vault';
import { defaultVaultPath } from '../../vault/index';

export interface GetOptions {
  key?: string;
  password: string;
  vaultPath?: string;
  environment?: string;
}

export async function getCommand(options: GetOptions): Promise<void> {
  const vaultPath = options.vaultPath ?? defaultVaultPath;
  const env = options.environment ?? 'default';

  const vault = await loadVault(vaultPath, options.password);
  const envVars = vault.environments[env];

  if (!envVars) {
    console.error(`Environment "${env}" not found in vault.`);
    process.exit(1);
  }

  if (options.key) {
    const value = envVars[options.key];
    if (value === undefined) {
      console.error(`Key "${options.key}" not found in [${env}]`);
      process.exit(1);
    }
    console.log(value);
    return;
  }

  // List all keys
  const keys = Object.keys(envVars);
  if (keys.length === 0) {
    console.log(`No variables stored in [${env}]`);
    return;
  }

  console.log(`Variables in [${env}]:`);
  for (const key of keys.sort()) {
    console.log(`  ${key}=${envVars[key]}`);
  }
}

export async function listEnvironmentsCommand(options: Pick<GetOptions, 'password' | 'vaultPath'>): Promise<void> {
  const vaultPath = options.vaultPath ?? defaultVaultPath;
  const vault = await loadVault(vaultPath, options.password);
  const envs = Object.keys(vault.environments);
  console.log('Environments:');
  for (const env of envs) {
    console.log(`  - ${env}`);
  }
}
