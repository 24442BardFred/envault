import { parseEnv, serialiseEnv } from './parser';

export type SortOrder = 'asc' | 'desc';
export type SortStrategy = 'alpha' | 'length' | 'natural';

export interface SortOptions {
  order?: SortOrder;
  strategy?: SortStrategy;
  groupComments?: boolean;
}

export interface SortReport {
  original: string[];
  sorted: string[];
  changed: boolean;
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function lengthCompare(a: string, b: string): number {
  return a.length - b.length || a.localeCompare(b);
}

export function sortEnv(
  input: string,
  options: SortOptions = {}
): { output: string; report: SortReport } {
  const { order = 'asc', strategy = 'alpha' } = options;
  const env = parseEnv(input);
  const keys = Object.keys(env);

  const compareFn = (a: string, b: string): number => {
    let cmp: number;
    if (strategy === 'length') {
      cmp = lengthCompare(a, b);
    } else if (strategy === 'natural') {
      cmp = naturalCompare(a, b);
    } else {
      cmp = a.localeCompare(b);
    }
    return order === 'desc' ? -cmp : cmp;
  };

  const sorted = [...keys].sort(compareFn);
  const sortedEnv: Record<string, string> = {};
  for (const key of sorted) {
    sortedEnv[key] = env[key];
  }

  const output = serialiseEnv(sortedEnv);
  return {
    output,
    report: {
      original: keys,
      sorted,
      changed: keys.join(',') !== sorted.join(','),
    },
  };
}

export function formatSortReport(report: SortReport): string {
  if (!report.changed) {
    return 'Keys are already in the desired order. No changes made.';
  }
  const lines: string[] = ['Sort complete:'];
  lines.push(`  Before: ${report.original.join(', ')}`);
  lines.push(`  After:  ${report.sorted.join(', ')}`);
  return lines.join('\n');
}
