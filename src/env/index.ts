/**
 * env module — utilities for reading, writing, and managing .env records.
 */

export { parseEnv, serialiseEnv } from './parser';
export type { EnvRecord } from './parser';

import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serialiseEnv, EnvRecord } from './parser';

/**
 * Read and parse a .env file from disk.
 * Returns an empty record if the file does not exist.
 */
export function readEnvFile(filePath: string): EnvRecord {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return {};
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  return parseEnv(content);
}

/**
 * Write a key-value record to a .env file on disk.
 * Creates the file (and parent directories) if they do not exist.
 */
export function writeEnvFile(filePath: string, record: EnvRecord): void {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, serialiseEnv(record), 'utf-8');
}

/**
 * Merge additional env variables into an existing .env file.
 * Existing keys are overwritten; new keys are appended.
 */
export function mergeEnvFile(filePath: string, additions: EnvRecord): void {
  const existing = readEnvFile(filePath);
  const merged = { ...existing, ...additions };
  writeEnvFile(filePath, merged);
}
