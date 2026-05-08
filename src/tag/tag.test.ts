import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addTag,
  removeTag,
  getKeysForTag,
  listTags,
  getTagsForKey,
  loadTagStore,
} from './tag';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tag-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loadTagStore returns empty store when no file exists', () => {
  const store = loadTagStore(tmpDir);
  expect(store.tags).toEqual({});
});

test('addTag creates a tag with keys', () => {
  addTag(tmpDir, 'database', ['DB_HOST', 'DB_PORT']);
  const keys = getKeysForTag(tmpDir, 'database');
  expect(keys).toEqual(['DB_HOST', 'DB_PORT']);
});

test('addTag merges keys without duplicates', () => {
  addTag(tmpDir, 'database', ['DB_HOST']);
  addTag(tmpDir, 'database', ['DB_HOST', 'DB_PORT']);
  const keys = getKeysForTag(tmpDir, 'database');
  expect(keys).toEqual(['DB_HOST', 'DB_PORT']);
});

test('removeTag deletes a tag', () => {
  addTag(tmpDir, 'database', ['DB_HOST']);
  removeTag(tmpDir, 'database');
  const tags = listTags(tmpDir);
  expect(tags).not.toContain('database');
});

test('listTags returns all tag names', () => {
  addTag(tmpDir, 'database', ['DB_HOST']);
  addTag(tmpDir, 'cache', ['REDIS_URL']);
  const tags = listTags(tmpDir);
  expect(tags).toContain('database');
  expect(tags).toContain('cache');
});

test('getTagsForKey returns tags containing a key', () => {
  addTag(tmpDir, 'database', ['DB_HOST', 'DB_PORT']);
  addTag(tmpDir, 'infra', ['DB_HOST', 'AWS_KEY']);
  const tags = getTagsForKey(tmpDir, 'DB_HOST');
  expect(tags).toContain('database');
  expect(tags).toContain('infra');
});

test('getKeysForTag returns empty array for unknown tag', () => {
  const keys = getKeysForTag(tmpDir, 'nonexistent');
  expect(keys).toEqual([]);
});
