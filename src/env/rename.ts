/**
 * Rename one or more environment variable keys, preserving values and order.
 */

export interface RenameEntry {
  from: string;
  to: string;
}

export interface RenameResult {
  renamed: RenameEntry[];
  skipped: RenameEntry[];
  conflicts: RenameEntry[];
}

export function renameEnv(
  env: Record<string, string>,
  renames: RenameEntry[]
): { env: Record<string, string>; result: RenameResult } {
  const output: Record<string, string> = { ...env };
  const result: RenameResult = { renamed: [], skipped: [], conflicts: [] };

  for (const entry of renames) {
    const { from, to } = entry;

    if (!(from in output)) {
      result.skipped.push(entry);
      continue;
    }

    if (to in output && to !== from) {
      result.conflicts.push(entry);
      continue;
    }

    const value = output[from];
    // Rebuild object to preserve insertion order at the same position
    const rebuilt: Record<string, string> = {};
    for (const key of Object.keys(output)) {
      if (key === from) {
        rebuilt[to] = value;
      } else if (key !== to) {
        rebuilt[key] = output[key];
      }
    }
    Object.assign(output, rebuilt);
    // Replace output keys
    for (const k of Object.keys(output)) {
      if (k !== to && !(k in rebuilt)) delete output[k];
    }
    Object.keys(output).forEach(k => { if (!(k in rebuilt)) delete output[k]; });
    Object.assign(output, rebuilt);
    // Sync output to rebuilt
    Object.keys(output).forEach(k => delete output[k]);
    Object.assign(output, rebuilt);

    result.renamed.push(entry);
  }

  return { env: output, result };
}

export function formatRenameReport(result: RenameResult): string {
  const lines: string[] = [];
  if (result.renamed.length) {
    lines.push('Renamed:');
    result.renamed.forEach(e => lines.push(`  ${e.from} → ${e.to}`));
  }
  if (result.skipped.length) {
    lines.push('Skipped (key not found):');
    result.skipped.forEach(e => lines.push(`  ${e.from}`));
  }
  if (result.conflicts.length) {
    lines.push('Conflicts (target key already exists):');
    result.conflicts.forEach(e => lines.push(`  ${e.to}`));
  }
  return lines.join('\n');
}
