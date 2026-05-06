import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigPath,
  DEFAULT_CONFIG,
} from './config';

const TEST_CONFIG_DIR = path.join(os.tmpdir(), '.envault-test-' + Date.now());

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => TEST_CONFIG_DIR,
}));

afterEach(() => {
  if (fs.existsSync(TEST_CONFIG_DIR)) {
    fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  }
});

describe('loadConfig', () => {
  it('returns default config when no file exists', () => {
    const config = loadConfig();
    expect(config.shareExpiryHours).toBe(DEFAULT_CONFIG.shareExpiryHours);
    expect(config.autoBackup).toBe(false);
  });

  it('merges saved config with defaults', () => {
    saveConfig({ shareExpiryHours: 48 });
    const config = loadConfig();
    expect(config.shareExpiryHours).toBe(48);
    expect(config.autoBackup).toBe(DEFAULT_CONFIG.autoBackup);
  });
});

describe('saveConfig', () => {
  it('persists config to disk', () => {
    saveConfig({ autoBackup: true });
    expect(fs.existsSync(getConfigPath())).toBe(true);
    const config = loadConfig();
    expect(config.autoBackup).toBe(true);
  });

  it('creates config directory if missing', () => {
    saveConfig({ shareExpiryHours: 12 });
    expect(fs.existsSync(path.dirname(getConfigPath()))).toBe(true);
  });
});

describe('resetConfig', () => {
  it('removes the config file', () => {
    saveConfig({ shareExpiryHours: 72 });
    resetConfig();
    expect(fs.existsSync(getConfigPath())).toBe(false);
  });

  it('does not throw if config file does not exist', () => {
    expect(() => resetConfig()).not.toThrow();
  });
});
