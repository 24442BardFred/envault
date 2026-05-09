import fs from 'fs';
import path from 'path';
import { parseEnv, serialiseEnv } from './parser';
import type { EnvMap } from './interpolate';

export { parseEnv, serialiseEnv };
export { validateEnv, formatValidationReport } from './validate';
export { validateWithSchema, formatSchemaReport } from './schema';
export { ejectEnvFromProcess } from './inject';
export { interpolateEnv, extractRefs, resolveValue } from './interpolate';
export type { InterpolationResult } from './interpolate';

/**
 * Read and parse a .env file from disk.
 */
export async function readEnvFile(filePath: string): Promise<EnvMap> {
  const resolved = path.resolve(filePath);
  const raw = await fs.promises.readFile(resolved, 'utf-8');
  return parseEnv(raw);
}

/**
 * Serialise and write an env map to a .env file.
 */
export async function writeEnvFile(filePath: string, env: EnvMap): Promise<void> {
  const resolved = path.resolve(filePath);
  const content = serialiseEnv(env);
  await fs.promises.writeFile(resolved, content, 'utf-8');
}

/**
 * Merge an env map into an existing .env file (adds/overwrites keys).
 */
export async function mergeEnvFile(filePath: string, incoming: EnvMap): Promise<EnvMap> {
  let existing: EnvMap = {};
  try {
    existing = await readEnvFile(filePath);
  } catch {
    // file may not exist yet
  }
  const merged = { ...existing, ...incoming };
  await writeEnvFile(filePath, merged);
  return merged;
}
