/**
 * Group environment variables by a common prefix or custom grouping strategy.
 */

export interface GroupResult {
  groups: Record<string, Record<string, string>>;
  ungrouped: Record<string, string>;
}

export interface GroupReport {
  totalKeys: number;
  groupCount: number;
  ungroupedCount: number;
  groups: Record<string, string[]>;
}

/**
 * Groups env vars by prefix (e.g. DB_HOST, DB_PORT → group "DB").
 * Prefix is determined by the first segment before the first underscore.
 */
export function groupEnv(
  env: Record<string, string>,
  minGroupSize = 2
): GroupResult {
  const buckets: Record<string, Record<string, string>> = {};
  const ungrouped: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    const underscoreIdx = key.indexOf('_');
    if (underscoreIdx > 0) {
      const prefix = key.slice(0, underscoreIdx);
      if (!buckets[prefix]) buckets[prefix] = {};
      buckets[prefix][key] = value;
    } else {
      ungrouped[key] = value;
    }
  }

  // Move groups below minGroupSize into ungrouped
  const groups: Record<string, Record<string, string>> = {};
  for (const [prefix, members] of Object.entries(buckets)) {
    if (Object.keys(members).length >= minGroupSize) {
      groups[prefix] = members;
    } else {
      Object.assign(ungrouped, members);
    }
  }

  return { groups, ungrouped };
}

export function formatGroupReport(result: GroupResult): GroupReport {
  const groups: Record<string, string[]> = {};
  for (const [prefix, members] of Object.entries(result.groups)) {
    groups[prefix] = Object.keys(members).sort();
  }

  const totalKeys =
    Object.values(result.groups).reduce((sum, m) => sum + Object.keys(m).length, 0) +
    Object.keys(result.ungrouped).length;

  return {
    totalKeys,
    groupCount: Object.keys(result.groups).length,
    ungroupedCount: Object.keys(result.ungrouped).length,
    groups,
  };
}
