import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  registerHook,
  removeHook,
  listHooks,
  loadHookStore,
  getHookPath,
} from './hook';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-hook-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loadHookStore returns empty store when no file exists', () => {
  const store = loadHookStore(tmpDir);
  expect(store.hooks).toEqual([]);
});

test('registerHook adds a hook entry', () => {
  registerHook(tmpDir, 'post-set', 'echo hello');
  const hooks = listHooks(tmpDir);
  expect(hooks).toHaveLength(1);
  expect(hooks[0]).toEqual({ event: 'post-set', command: 'echo hello' });
});

test('registerHook does not add duplicate hooks', () => {
  registerHook(tmpDir, 'post-set', 'echo hello');
  registerHook(tmpDir, 'post-set', 'echo hello');
  expect(listHooks(tmpDir)).toHaveLength(1);
});

test('registerHook allows same command on different events', () => {
  registerHook(tmpDir, 'pre-set', 'echo hello');
  registerHook(tmpDir, 'post-set', 'echo hello');
  expect(listHooks(tmpDir)).toHaveLength(2);
});

test('removeHook removes the matching hook', () => {
  registerHook(tmpDir, 'pre-rotate', 'echo rotate');
  const removed = removeHook(tmpDir, 'pre-rotate', 'echo rotate');
  expect(removed).toBe(true);
  expect(listHooks(tmpDir)).toHaveLength(0);
});

test('removeHook returns false when hook not found', () => {
  const removed = removeHook(tmpDir, 'pre-get', 'echo noop');
  expect(removed).toBe(false);
});

test('listHooks filters by event', () => {
  registerHook(tmpDir, 'pre-set', 'echo a');
  registerHook(tmpDir, 'post-set', 'echo b');
  const preHooks = listHooks(tmpDir, 'pre-set');
  expect(preHooks).toHaveLength(1);
  expect(preHooks[0].command).toBe('echo a');
});

test('hook store is persisted to disk', () => {
  registerHook(tmpDir, 'post-get', 'echo persisted');
  const raw = fs.readFileSync(getHookPath(tmpDir), 'utf-8');
  const parsed = JSON.parse(raw);
  expect(parsed.hooks[0].command).toBe('echo persisted');
});
