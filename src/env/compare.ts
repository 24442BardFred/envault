/**
 * Compare two sets of env variables and produce a structured report.
 * Useful for auditing drift between environments (e.g. staging vs production).
 */

export type CompareStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface CompareEntry {
  key: string;
  status: CompareStatus;
  baseValue?: string;
  targetValue?: string;
}

export interface CompareReport {
  entries: CompareEntry[];
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
}

export function compareEnv(
  base: Record<string, string>,
  target: Record<string, string>
): CompareReport {
  const allKeys = new Set([...Object.keys(base), ...Object.keys(target)]);
  const entries: CompareEntry[] = [];

  for (const key of allKeys) {
    const inBase = Object.prototype.hasOwnProperty.call(base, key);
    const inTarget = Object.prototype.hasOwnProperty.call(target, key);

    if (inBase && !inTarget) {
      entries.push({ key, status: 'removed', baseValue: base[key] });
    } else if (!inBase && inTarget) {
      entries.push({ key, status: 'added', targetValue: target[key] });
    } else if (base[key] !== target[key]) {
      entries.push({ key, status: 'changed', baseValue: base[key], targetValue: target[key] });
    } else {
      entries.push({ key, status: 'unchanged', baseValue: base[key], targetValue: target[key] });
    }
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));

  return {
    entries,
    added: entries.filter(e => e.status === 'added').length,
    removed: entries.filter(e => e.status === 'removed').length,
    changed: entries.filter(e => e.status === 'changed').length,
    unchanged: entries.filter(e => e.status === 'unchanged').length,
  };
}

export function formatCompareReport(report: CompareReport, showUnchanged = false): string {
  const lines: string[] = [];
  const symbols: Record<CompareStatus, string> = {
    added: '+',
    removed: '-',
    changed: '~',
    unchanged: ' ',
  };

  for (const entry of report.entries) {
    if (!showUnchanged && entry.status === 'unchanged') continue;
    const sym = symbols[entry.status];
    if (entry.status === 'changed') {
      lines.push(`${sym} ${entry.key}: ${entry.baseValue} → ${entry.targetValue}`);
    } else if (entry.status === 'added') {
      lines.push(`${sym} ${entry.key}: ${entry.targetValue}`);
    } else if (entry.status === 'removed') {
      lines.push(`${sym} ${entry.key}: ${entry.baseValue}`);
    } else {
      lines.push(`${sym} ${entry.key}: ${entry.baseValue}`);
    }
  }

  lines.push('');
  lines.push(`Summary: +${report.added} added, -${report.removed} removed, ~${report.changed} changed, ${report.unchanged} unchanged`);
  return lines.join('\n');
}
