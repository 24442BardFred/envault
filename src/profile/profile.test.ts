import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createProfile,
  switchProfile,
  deleteProfile,
  getActiveProfile,
  listProfiles,
  loadProfileStore,
  saveProfileStore,
} from './profile';

const PROFILE_FILE = path.join(os.homedir(), '.envault', 'profiles.json');

function resetStore() {
  if (fs.existsSync(PROFILE_FILE)) {
    fs.unlinkSync(PROFILE_FILE);
  }
}

describe('profile management', () => {
  beforeEach(() => resetStore());
  afterAll(() => resetStore());

  it('creates a profile and sets it as active', () => {
    const p = createProfile('dev', '/tmp/dev.vault');
    expect(p.name).toBe('dev');
    expect(p.vaultPath).toBe('/tmp/dev.vault');
    const store = loadProfileStore();
    expect(store.active).toBe('dev');
  });

  it('throws when creating a duplicate profile', () => {
    createProfile('dev', '/tmp/dev.vault');
    expect(() => createProfile('dev', '/tmp/other.vault')).toThrow(
      'Profile "dev" already exists.'
    );
  });

  it('switches active profile', () => {
    createProfile('dev', '/tmp/dev.vault');
    createProfile('prod', '/tmp/prod.vault');
    switchProfile('prod');
    const store = loadProfileStore();
    expect(store.active).toBe('prod');
  });

  it('throws when switching to non-existent profile', () => {
    expect(() => switchProfile('ghost')).toThrow(
      'Profile "ghost" does not exist.'
    );
  });

  it('deletes a profile and reassigns active', () => {
    createProfile('dev', '/tmp/dev.vault');
    createProfile('staging', '/tmp/staging.vault');
    deleteProfile('dev');
    const store = loadProfileStore();
    expect(store.profiles['dev']).toBeUndefined();
    expect(store.active).toBe('staging');
  });

  it('sets active to null when last profile is deleted', () => {
    createProfile('solo', '/tmp/solo.vault');
    deleteProfile('solo');
    const store = loadProfileStore();
    expect(store.active).toBeNull();
  });

  it('lists all profiles', () => {
    createProfile('dev', '/tmp/dev.vault');
    createProfile('prod', '/tmp/prod.vault');
    const profiles = listProfiles();
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.name)).toContain('dev');
    expect(profiles.map((p) => p.name)).toContain('prod');
  });

  it('returns null when no active profile', () => {
    const active = getActiveProfile();
    expect(active).toBeNull();
  });
});
