import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerHook, listHooks, removeHook } from '../../hook';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-hook-cmd-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('registers a post-set hook and lists it', () => {
  registerHook(tmpDir, 'post-set', 'npm run sync');
  const hooks = listHooks(tmpDir, 'post-set');
  expect(hooks).toHaveLength(1);
  expect(hooks[0].command).toBe('npm run sync');
});

test('removes a registered hook', () => {
  registerHook(tmpDir, 'pre-rotate', 'echo before-rotate');
  removeHook(tmpDir, 'pre-rotate', 'echo before-rotate');
  expect(listHooks(tmpDir, 'pre-rotate')).toHaveLength(0);
});

test('listing all hooks returns hooks across events', () => {
  registerHook(tmpDir, 'pre-set', 'echo pre');
  registerHook(tmpDir, 'post-get', 'echo post');
  expect(listHooks(tmpDir)).toHaveLength(2);
});

test('listing with unknown event returns empty array', () => {
  registerHook(tmpDir, 'pre-set', 'echo pre');
  const hooks = listHooks(tmpDir, 'post-rotate');
  expect(hooks).toHaveLength(0);
});

test('duplicate registration is idempotent', () => {
  registerHook(tmpDir, 'post-set', 'echo dup');
  registerHook(tmpDir, 'post-set', 'echo dup');
  registerHook(tmpDir, 'post-set', 'echo dup');
  expect(listHooks(tmpDir)).toHaveLength(1);
});

test('removing non-existent hook returns false', () => {
  const result = removeHook(tmpDir, 'pre-get', 'echo missing');
  expect(result).toBe(false);
});
