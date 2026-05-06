import { loadVault, saveVault } from '../../vault/vault';
import { defaultVaultPath } from '../../vault/index';

export interface SetOptions {
  key: string;
  value: string;
  password: string;
  vaultPath?: string;
  environment?: string;
}

export async function setCommand(options: SetOptions): Promise<void> {
  const vaultPath = options.vaultPath ?? defaultVaultPath;
  const env = options.environment ?? 'default';

  const vault = await loadVault(vaultPath, options.password);

  if (!vault.environments[env]) {
    vault.environments[env] = {};
  }

  vault.environments[env][options.key] = options.value;

  await saveVault(vaultPath, options.password, vault);

  console.log(`Set ${options.key} in [${env}]`);
}

export async function unsetCommand(options: Omit<SetOptions, 'value'>): Promise<void> {
  const vaultPath = options.vaultPath ?? defaultVaultPath;
  const env = options.environment ?? 'default';

  const vault = await loadVault(vaultPath, options.password);

  if (!vault.environments[env] || !(options.key in vault.environments[env])) {
    console.warn(`Key "${options.key}" not found in [${env}]`);
    return;
  }

  delete vault.environments[env][options.key];
  await saveVault(vaultPath, options.password, vault);

  console.log(`Removed ${options.key} from [${env}]`);
}
