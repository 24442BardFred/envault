import * as fs from 'fs';
import * as path from 'path';

export interface TagStore {
  tags: Record<string, string[]>; // tag -> list of env keys
}

const TAG_FILE = '.envault-tags.json';

export function getTagPath(vaultDir: string): string {
  return path.join(vaultDir, TAG_FILE);
}

export function loadTagStore(vaultDir: string): TagStore {
  const tagPath = getTagPath(vaultDir);
  if (!fs.existsSync(tagPath)) {
    return { tags: {} };
  }
  const raw = fs.readFileSync(tagPath, 'utf-8');
  return JSON.parse(raw) as TagStore;
}

export function saveTagStore(vaultDir: string, store: TagStore): void {
  const tagPath = getTagPath(vaultDir);
  fs.writeFileSync(tagPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addTag(vaultDir: string, tag: string, keys: string[]): TagStore {
  const store = loadTagStore(vaultDir);
  const existing = store.tags[tag] ?? [];
  const merged = Array.from(new Set([...existing, ...keys]));
  store.tags[tag] = merged;
  saveTagStore(vaultDir, store);
  return store;
}

export function removeTag(vaultDir: string, tag: string): TagStore {
  const store = loadTagStore(vaultDir);
  delete store.tags[tag];
  saveTagStore(vaultDir, store);
  return store;
}

export function getKeysForTag(vaultDir: string, tag: string): string[] {
  const store = loadTagStore(vaultDir);
  return store.tags[tag] ?? [];
}

export function listTags(vaultDir: string): string[] {
  const store = loadTagStore(vaultDir);
  return Object.keys(store.tags);
}

export function getTagsForKey(vaultDir: string, key: string): string[] {
  const store = loadTagStore(vaultDir);
  return Object.entries(store.tags)
    .filter(([, keys]) => keys.includes(key))
    .map(([tag]) => tag);
}
