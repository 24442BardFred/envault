import fs from 'fs';
import path from 'path';
import os from 'os';

export interface EnvaultConfig {
  defaultVaultPath: string;
  auditLogPath: string;
  shareExpiryHours: number;
  autoBackup: boolean;
  backupDir: string;
}

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.envault');
const CONFIG_FILE_NAME = 'config.json';

export const DEFAULT_CONFIG: EnvaultConfig = {
  defaultVaultPath: path.join(DEFAULT_CONFIG_DIR, 'vault.enc'),
  auditLogPath: path.join(DEFAULT_CONFIG_DIR, 'audit.log'),
  shareExpiryHours: 24,
  autoBackup: false,
  backupDir: path.join(DEFAULT_CONFIG_DIR, 'backups'),
};

export function getConfigPath(): string {
  return path.join(DEFAULT_CONFIG_DIR, CONFIG_FILE_NAME);
}

export function loadConfig(): EnvaultConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<EnvaultConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Partial<EnvaultConfig>): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const current = loadConfig();
  const merged = { ...current, ...config };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
}

export function resetConfig(): void {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
