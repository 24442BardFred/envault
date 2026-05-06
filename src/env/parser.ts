/**
 * Parses and serialises .env file content.
 */

export interface EnvRecord {
  [key: string]: string;
}

/**
 * Parse a .env file string into a key-value record.
 * Supports comments (#), blank lines, and quoted values.
 */
export function parseEnv(content: string): EnvRecord {
  const result: EnvRecord = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    // Skip blank lines and comments
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip surrounding quotes (single or double)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialise a key-value record back into .env file format.
 */
export function serialiseEnv(record: EnvRecord): string {
  return Object.entries(record)
    .map(([key, value]) => {
      // Quote values that contain spaces or special characters
      const needsQuotes = /[\s#"'\\]/.test(value);
      const serialisedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}=${serialisedValue}`;
    })
    .join('\n');
}
