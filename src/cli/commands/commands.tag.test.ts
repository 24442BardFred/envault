import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addTag, removeTag, listTags, getKeysForTag, getTagsForKey } from '../../tag';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cmd-tag-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('add tag and verify keys are stored', () => {
  addTag(tmpDir, 'auth', ['JWT_SECRET', 'OAUTH_ID']);
  const keys = getKeysForTag(tmpDir, 'auth');
  expect(keys).toContain('JWT_SECRET');
  expect(keys).toContain('OAUTH_ID');
});

test('list shows added tags', () => {
  addTag(tmpDir, 'auth', ['JWT_SECRET']);
  addTag(tmpDir, 'db', ['DB_URL']);
  const tags = listTags(tmpDir);
  expect(tags).toHaveLength(2);
  expect(tags).toContain('auth');
  expect(tags).toContain('db');
});

test('remove tag removes it from list', () => {
  addTag(tmpDir, 'auth', ['JWT_SECRET']);
  removeTag(tmpDir, 'auth');
  const tags = listTags(tmpDir);
  expect(tags).not.toContain('auth');
});

test('getTagsForKey returns correct tags', () => {
  addTag(tmpDir, 'auth', ['JWT_SECRET', 'OAUTH_ID']);
  addTag(tmpDir, 'security', ['JWT_SECRET']);
  const tags = getTagsForKey(tmpDir, 'JWT_SECRET');
  expect(tags).toContain('auth');
  expect(tags).toContain('security');
});

test('getTagsForKey returns empty for untagged key', () => {
  addTag(tmpDir, 'auth', ['JWT_SECRET']);
  const tags = getTagsForKey(tmpDir, 'UNKNOWN_KEY');
  expect(tags).toEqual([]);
});

test('adding same key twice to tag does not duplicate', () => {
  addTag(tmpDir, 'auth', ['JWT_SECRET']);
  addTag(tmpDir, 'auth', ['JWT_SECRET', 'OAUTH_ID']);
  const keys = getKeysForTag(tmpDir, 'auth');
  const jwtCount = keys.filter((k) => k === 'JWT_SECRET').length;
  expect(jwtCount).toBe(1);
});
