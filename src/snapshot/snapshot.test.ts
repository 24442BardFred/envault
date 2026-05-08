import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getSnapshotPath,
  createSnapshot,
  listSnapshots,
  getSnapshot,
  deleteSnapshot,
  computeChecksum,
} from './snapshot';

let tmpDir: string;
let snapshotPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snap-'));
  snapshotPath = getSnapshotPath(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('computeChecksum produces consistent hash', () => {
  const data = { FOO: 'bar', BAZ: 'qux' };
  const c1 = computeChecksum(data);
  const c2 = computeChecksum({ BAZ: 'qux', FOO: 'bar' });
  expect(c1).toBe(c2);
  expect(c1).toHaveLength(12);
});

test('createSnapshot stores a snapshot', () => {
  const data = { API_KEY: 'secret', PORT: '3000' };
  const snap = createSnapshot(snapshotPath, data, 'initial');
  expect(snap.label).toBe('initial');
  expect(snap.data).toEqual(data);
  expect(snap.checksum).toHaveLength(12);
});

test('listSnapshots returns all snapshots', () => {
  createSnapshot(snapshotPath, { A: '1' }, 'first');
  createSnapshot(snapshotPath, { A: '2' }, 'second');
  const snaps = listSnapshots(snapshotPath);
  expect(snaps).toHaveLength(2);
  expect(snaps.map((s) => s.label)).toEqual(['first', 'second']);
});

test('getSnapshot retrieves by partial id', () => {
  const snap = createSnapshot(snapshotPath, { X: 'y' }, 'test');
  const found = getSnapshot(snapshotPath, snap.id.slice(0, 8));
  expect(found).toBeDefined();
  expect(found!.id).toBe(snap.id);
});

test('getSnapshot returns undefined for unknown id', () => {
  createSnapshot(snapshotPath, { X: 'y' }, 'test');
  expect(getSnapshot(snapshotPath, 'nonexistent')).toBeUndefined();
});

test('deleteSnapshot removes the entry', () => {
  const snap = createSnapshot(snapshotPath, { A: '1' }, 'to-delete');
  const result = deleteSnapshot(snapshotPath, snap.id);
  expect(result).toBe(true);
  expect(listSnapshots(snapshotPath)).toHaveLength(0);
});

test('deleteSnapshot returns false when id not found', () => {
  const result = deleteSnapshot(snapshotPath, 'unknown-id');
  expect(result).toBe(false);
});
