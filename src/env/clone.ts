import { EnvMap } from './parser';

export interface CloneOptions {
  prefix?: string;
  suffix?: string;
  overwrite?: boolean;
  keys?: string[];
}

export interface CloneReport {
  cloned: Array<{ from: string; to: string }>;
  skipped: Array<{ from: string; to: string; reason: string }>;
}

export function cloneEnv(
  env: EnvMap,
  options: CloneOptions = {}
): { result: EnvMap; report: CloneReport } {
  const { prefix = '', suffix = '', overwrite = false, keys } = options;
  const result: EnvMap = { ...env };
  const report: CloneReport = { cloned: [], skipped: [] };

  const targetKeys = keys ?? Object.keys(env);

  for (const key of targetKeys) {
    if (!(key in env)) {
      report.skipped.push({ from: key, to: key, reason: 'key not found in source' });
      continue;
    }

    const newKey = `${prefix}${key}${suffix}`;

    if (newKey === key) {
      report.skipped.push({ from: key, to: newKey, reason: 'source and destination keys are identical' });
      continue;
    }

    if (newKey in result && !overwrite) {
      report.skipped.push({ from: key, to: newKey, reason: 'destination key already exists' });
      continue;
    }

    result[newKey] = env[key];
    report.cloned.push({ from: key, to: newKey });
  }

  return { result, report };
}

export function formatCloneReport(report: CloneReport): string {
  const lines: string[] = [];

  if (report.cloned.length > 0) {
    lines.push(`Cloned (${report.cloned.length}):`);
    for (const { from, to } of report.cloned) {
      lines.push(`  ${from} → ${to}`);
    }
  }

  if (report.skipped.length > 0) {
    lines.push(`Skipped (${report.skipped.length}):`);
    for (const { from, to, reason } of report.skipped) {
      lines.push(`  ${from} → ${to}: ${reason}`);
    }
  }

  if (lines.length === 0) {
    lines.push('No keys cloned.');
  }

  return lines.join('\n');
}
