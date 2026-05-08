import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface Snapshot {
  id: string;
  label: string;
  timestamp: string;
  checksum: string;
  data: Record<string, string>;
}

export interface SnapshotStore {
  snapshots: Snapshot[];
}

const SNAPSHOT_FILE = '.envault-snapshots.json';

export function getSnapshotPath(dir: string = process.cwd()): string {
  return path.join(dir, SNAPSHOT_FILE);
}

export function loadSnapshotStore(snapshotPath: string): SnapshotStore {
  if (!fs.existsSync(snapshotPath)) {
    return { snapshots: [] };
  }
  const raw = fs.readFileSync(snapshotPath, 'utf-8');
  return JSON.parse(raw) as SnapshotStore;
}

export function saveSnapshotStore(snapshotPath: string, store: SnapshotStore): void {
  fs.writeFileSync(snapshotPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function computeChecksum(data: Record<string, string>): string {
  const serialised = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(serialised).digest('hex').slice(0, 12);
}

export function createSnapshot(
  snapshotPath: string,
  data: Record<string, string>,
  label: string
): Snapshot {
  const store = loadSnapshotStore(snapshotPath);
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    label,
    timestamp: new Date().toISOString(),
    checksum: computeChecksum(data),
    data,
  };
  store.snapshots.push(snapshot);
  saveSnapshotStore(snapshotPath, store);
  return snapshot;
}

export function listSnapshots(snapshotPath: string): Snapshot[] {
  const store = loadSnapshotStore(snapshotPath);
  return store.snapshots;
}

export function getSnapshot(snapshotPath: string, id: string): Snapshot | undefined {
  const store = loadSnapshotStore(snapshotPath);
  return store.snapshots.find((s) => s.id === id || s.id.startsWith(id));
}

export function deleteSnapshot(snapshotPath: string, id: string): boolean {
  const store = loadSnapshotStore(snapshotPath);
  const before = store.snapshots.length;
  store.snapshots = store.snapshots.filter((s) => !s.id.startsWith(id));
  if (store.snapshots.length < before) {
    saveSnapshotStore(snapshotPath, store);
    return true;
  }
  return false;
}
