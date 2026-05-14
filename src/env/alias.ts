/**
 * alias.ts — Rename/alias environment variable keys
 * Supports mapping old key names to new ones, with optional deletion of originals.
 */

export interface AliasMap {
  [fromKey: string]: string;
}

export interface AliasResult {
  renamed: Array<{ from: string; to: string }>;
  skipped: Array<{ from: string; reason: string }>;
  output: Record<string, string>;
}

/**
 * Applies an alias map to an env record, renaming keys.
 * If `removeOriginal` is true, the old key is removed after aliasing.
 */
export function aliasEnv(
  env: Record<string, string>,
  aliases: AliasMap,
  removeOriginal = true
): AliasResult {
  const output: Record<string, string> = { ...env };
  const renamed: AliasResult["renamed"] = [];
  const skipped: AliasResult["skipped"] = [];

  for (const [from, to] of Object.entries(aliases)) {
    if (!(from in env)) {
      skipped.push({ from, reason: `key "${from}" not found in env` });
      continue;
    }
    if (to in env && to !== from) {
      skipped.push({ from, reason: `target key "${to}" already exists` });
      continue;
    }
    output[to] = env[from];
    if (removeOriginal && to !== from) {
      delete output[from];
    }
    renamed.push({ from, to });
  }

  return { renamed, skipped, output };
}

/**
 * Formats an AliasResult into a human-readable report string.
 */
export function formatAliasReport(result: AliasResult): string {
  const lines: string[] = [];

  if (result.renamed.length > 0) {
    lines.push("Renamed:");
    for (const { from, to } of result.renamed) {
      lines.push(`  ${from} → ${to}`);
    }
  }

  if (result.skipped.length > 0) {
    lines.push("Skipped:");
    for (const { from, reason } of result.skipped) {
      lines.push(`  ${from}: ${reason}`);
    }
  }

  if (lines.length === 0) {
    return "No aliases applied.";
  }

  return lines.join("\n");
}
