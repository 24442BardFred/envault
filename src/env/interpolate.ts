/**
 * Interpolate variable references within env values.
 * Supports ${VAR} and $VAR syntax.
 */

export type EnvMap = Record<string, string>;

export interface InterpolationResult {
  resolved: EnvMap;
  unresolved: string[];
  circular: string[];
}

const VAR_PATTERN = /\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g;

/**
 * Extract all variable references from a value string.
 */
export function extractRefs(value: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  VAR_PATTERN.lastIndex = 0;
  while ((match = VAR_PATTERN.exec(value)) !== null) {
    refs.push(match[1] ?? match[2]);
  }
  return refs;
}

/**
 * Resolve a single value against the provided env map.
 */
export function resolveValue(value: string, env: EnvMap): string {
  return value.replace(VAR_PATTERN, (_, braced, bare) => {
    const key = braced ?? bare;
    return Object.prototype.hasOwnProperty.call(env, key) ? env[key] : `\$\{${key}\}`;
  });
}

/**
 * Detect circular references using DFS.
 */
function hasCircular(key: string, env: EnvMap, visited: Set<string>, stack: Set<string>): boolean {
  if (stack.has(key)) return true;
  if (visited.has(key)) return false;
  visited.add(key);
  stack.add(key);
  const refs = extractRefs(env[key] ?? '');
  for (const ref of refs) {
    if (hasCircular(ref, env, visited, stack)) return true;
  }
  stack.delete(key);
  return false;
}

/**
 * Interpolate all variable references in an env map.
 * Returns resolved values, unresolved keys, and circular references.
 */
export function interpolateEnv(env: EnvMap): InterpolationResult {
  const circular: string[] = [];
  const unresolved: string[] = [];
  const resolved: EnvMap = {};

  for (const key of Object.keys(env)) {
    if (hasCircular(key, env, new Set(), new Set())) {
      circular.push(key);
      resolved[key] = env[key];
      continue;
    }
  }

  // Topological resolution — iterate until stable
  let working: EnvMap = { ...env };
  for (let pass = 0; pass < Object.keys(env).length; pass++) {
    const next: EnvMap = {};
    for (const [k, v] of Object.entries(working)) {
      next[k] = circular.includes(k) ? v : resolveValue(v, working);
    }
    working = next;
  }

  for (const [k, v] of Object.entries(working)) {
    resolved[k] = v;
    if (!circular.includes(k) && extractRefs(v).length > 0) {
      unresolved.push(k);
    }
  }

  return { resolved, unresolved, circular };
}
