import * as fs from 'fs';
import * as path from 'path';
import { parseEnv } from '../env/parser';
import { diffEnv, formatDiff } from './diff';

export { diffEnv, formatDiff } from './diff';

/**
 * Compare two .env files and return a formatted diff string.
 * @param fileA Path to the first .env file (or baseline)
 * @param fileB Path to the second .env file (or updated)
 * @returns Formatted diff output
 */
export function diffFiles(fileA: string, fileB: string): string {
  const readFile = (filePath: string): Record<string, string> => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return parseEnv(raw);
  };

  const envA = readFile(fileA);
  const envB = readFile(fileB);
  const changes = diffEnv(envA, envB);
  return formatDiff(changes);
}

/**
 * Compare a plain .env file against the decrypted vault contents.
 * @param envPath Path to the .env file
 * @param vaultEnv Decrypted vault env record
 * @returns Formatted diff output
 */
export function diffAgainstVault(
  envPath: string,
  vaultEnv: Record<string, string>
): string {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Env file not found: ${envPath}`);
  }
  const raw = fs.readFileSync(envPath, 'utf-8');
  const fileEnv = parseEnv(raw);
  const changes = diffEnv(vaultEnv, fileEnv);
  return formatDiff(changes);
}
