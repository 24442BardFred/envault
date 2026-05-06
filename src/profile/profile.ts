import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface EnvaultProfile {
  name: string;
  vaultPath: string;
  createdAt: string;
  lastUsed: string;
}

export interface ProfileStore {
  active: string | null;
  profiles: Record<string, EnvaultProfile>;
}

const PROFILE_DIR = path.join(os.homedir(), '.envault');
const PROFILE_FILE = path.join(PROFILE_DIR, 'profiles.json');

function ensureProfileDir(): void {
  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }
}

export function loadProfileStore(): ProfileStore {
  ensureProfileDir();
  if (!fs.existsSync(PROFILE_FILE)) {
    return { active: null, profiles: {} };
  }
  const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
  return JSON.parse(raw) as ProfileStore;
}

export function saveProfileStore(store: ProfileStore): void {
  ensureProfileDir();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export function createProfile(name: string, vaultPath: string): EnvaultProfile {
  const store = loadProfileStore();
  if (store.profiles[name]) {
    throw new Error(`Profile "${name}" already exists.`);
  }
  const profile: EnvaultProfile = {
    name,
    vaultPath,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  };
  store.profiles[name] = profile;
  if (store.active === null) {
    store.active = name;
  }
  saveProfileStore(store);
  return profile;
}

export function switchProfile(name: string): void {
  const store = loadProfileStore();
  if (!store.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  store.profiles[name].lastUsed = new Date().toISOString();
  store.active = name;
  saveProfileStore(store);
}

export function deleteProfile(name: string): void {
  const store = loadProfileStore();
  if (!store.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  delete store.profiles[name];
  if (store.active === name) {
    const remaining = Object.keys(store.profiles);
    store.active = remaining.length > 0 ? remaining[0] : null;
  }
  saveProfileStore(store);
}

export function getActiveProfile(): EnvaultProfile | null {
  const store = loadProfileStore();
  if (!store.active) return null;
  return store.profiles[store.active] ?? null;
}

export function listProfiles(): EnvaultProfile[] {
  const store = loadProfileStore();
  return Object.values(store.profiles);
}
